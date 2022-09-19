/**
 * @module iframe-embed/iframeembedediting
 */

import { Plugin, icons } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';
import { toWidget } from 'ckeditor5/src/widget';
import { logWarning, createElement } from 'ckeditor5/src/utils';

import InsertIframeEmbedCommand from './insertiframeembedcommand';
import UpdateIframeEmbedCommand from './updateiframeembedcommand';

import './theme/lark.css';
import './theme/iframeembed.css';

/**
 * The iframe embed editing feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class IframeEmbedEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'IframeEmbedEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'iframeEmbed', {
			showPreviews: false,
			sanitizeHtml: iframeHtml => {
				/**
				 * When using the iframe embed feature with the `iframeEmbed.showPreviews=true` option, it is strongly recommended to
				 * define a sanitize function that will clean up the input iframe in order to avoid XSS vulnerability.
				 *
				 * For a detailed overview, check the {@glink features/iframe-embed iframe embed feature} documentation.
				 *
				 * @error iframe-embed-provide-sanitize-function
				 */
				logWarning( 'iframe-embed-provide-sanitize-function' );

				return {
					html: iframeHtml,
					hasChanged: false
				};
			}
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register( 'iframe', {
			isObject: true,
			allowWhere: '$block',
			allowAttributes: [ 'value' ]
		} );

		editor.commands.add(
			'updateIframeEmbed',
			new UpdateIframeEmbedCommand( editor )
		);
		editor.commands.add(
			'insertIframeEmbed',
			new InsertIframeEmbedCommand( editor )
		);

		this._setupConversion();
	}

	/**
	 * Prepares converters for the feature.
	 *
	 * @private
	 */
	_setupConversion() {
		const editor = this.editor;
		const t = editor.t;
		const view = editor.editing.view;

		const iframeEmbedConfig = editor.config.get( 'iframeEmbed' );

		editor.conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'figure',
				classes: 'iframe-embed'
			},
			model: ( viewElement, { writer } ) => {
				// The figure.iframe-embed is registered as a raw content element,
				// so all it's content is available in a custom property.
				return writer.createElement( 'iframe', {
					value: viewElement.getChild( 0 ).getAttribute( 'src' )
				} );
			}
		} );

		editor.conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'iframe',
			view: ( modelElement, { writer } ) => {
				const url = modelElement.getAttribute( 'value' ) || '';
				const embedElement = writer.createContainerElement( 'figure', {
					class: 'iframe-embed'
				} );
				writer.insert(
					writer.createPositionAt( embedElement, 0 ),
					writer.createRawElement( 'iframe', { src: url } )
				);
				return embedElement;
			}
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			triggerBy: {
				attributes: [ 'value' ]
			},
			model: 'iframe',
			view: ( modelElement, { writer } ) => {
				let domContentWrapper, state, props;

				const viewContainer = writer.createContainerElement( 'figure', {
					class: 'iframe-embed',
					'data-iframe-embed-label': t( 'Embed link' ),
					dir: editor.locale.uiLanguageDirection
				} );

				// Widget cannot be a raw element because the widget system would not be able
				// to add its UI to it. Thus, we need this wrapper.
				const viewContentWrapper = writer.createRawElement(
					'div',
					{
						class: 'iframe-embed__content-wrapper'
					},
					function( domElement ) {
						domContentWrapper = domElement;

						renderContent( { domElement, editor, state, props } );

						// Since there is a `data-cke-ignore-events` attribute set on the wrapper element in the editable mode,
						// the explicit `mousedown` handler on the `capture` phase is needed to move the selection onto the whole
						// iframe embed widget.
						domContentWrapper.addEventListener(
							'mousedown',
							() => {
								if ( state.isEditable ) {
									const model = editor.model;
									const selectedElement =
										model.document.selection.getSelectedElement();

									// Move the selection onto the whole iframe embed widget if it's currently not selected.
									if ( selectedElement !== modelElement ) {
										model.change( writer =>
											writer.setSelection( modelElement, 'on' )
										);
									}
								}
							},
							true
						);
					}
				);

				// API exposed on each raw iframe embed widget so other features can control a particular widget.
				const iframeApi = {
					makeEditable() {
						state = Object.assign( {}, state, {
							isEditable: true
						} );

						renderContent( {
							domElement: domContentWrapper,
							editor,
							state,
							props
						} );

						view.change( writer => {
							writer.setAttribute(
								'data-cke-ignore-events',
								'true',
								viewContentWrapper
							);
						} );

						// This could be potentially pulled to a separate method called focusTextarea().
						domContentWrapper.querySelector( 'input' ).focus();
					},
					save( newValue ) {
						// If the value didn't change, we just cancel. If it changed,
						// it's enough to update the model – the entire widget will be reconverted.
						if ( newValue !== state.getRawHtmlValue() ) {
							editor.execute( 'updateIframeEmbed', newValue );
							editor.editing.view.focus();
						} else {
							this.cancel();
						}
					},
					cancel() {
						state = Object.assign( {}, state, {
							isEditable: false
						} );

						renderContent( {
							domElement: domContentWrapper,
							editor,
							state,
							props
						} );
						editor.editing.view.focus();

						view.change( writer => {
							writer.removeAttribute(
								'data-cke-ignore-events',
								viewContentWrapper
							);
						} );
					}
				};

				state = {
					showPreviews: iframeEmbedConfig.showPreviews,
					isEditable: false,
					getRawHtmlValue: () => modelElement.getAttribute( 'value' ) || ''
				};

				props = {
					sanitizeHtml: iframeEmbedConfig.sanitizeHtml,
					textareaPlaceholder: t( 'Paste in https://...' ),

					onEditClick() {
						iframeApi.makeEditable();
					},
					onSaveClick( newValue ) {
						iframeApi.save( newValue );
					},
					onCancelClick() {
						iframeApi.cancel();
					}
				};

				writer.insert(
					writer.createPositionAt( viewContainer, 0 ),
					viewContentWrapper
				);

				writer.setCustomProperty( 'iframeApi', iframeApi, viewContainer );
				writer.setCustomProperty( 'iframe', true, viewContainer );

				return toWidget( viewContainer, writer, {
					widgetLabel: t( 'Embed link' ),
					hasSelectionHandle: true
				} );
			}
		} );

		function renderContent( { domElement, editor, state, props } ) {
			// Remove all children;
			domElement.textContent = '';

			const domDocument = domElement.ownerDocument;
			let domTextarea;

			if ( state.isEditable ) {
				const textareaProps = {
					isDisabled: false,
					placeholder: props.textareaPlaceholder
				};

				domTextarea = createDomTextarea( {
					domDocument,
					state,
					props: textareaProps
				} );

				domElement.append( domTextarea );
			} else if ( state.showPreviews ) {
				const previewContainerProps = {
					sanitizeHtml: props.sanitizeHtml
				};

				domElement.append(
					createPreviewContainer( {
						domDocument,
						state,
						props: previewContainerProps,
						editor
					} )
				);
			} else {
				const textareaProps = {
					isDisabled: true,
					placeholder: props.textareaPlaceholder
				};

				domElement.append(
					createDomTextarea( { domDocument, state, props: textareaProps } )
				);
			}

			const buttonsWrapperProps = {
				onEditClick: props.onEditClick,
				onSaveClick: () => {
					props.onSaveClick( domTextarea.value );
				},
				onCancelClick: props.onCancelClick
			};
			domElement.prepend(
				createDomButtonsWrapper( {
					editor,
					domDocument,
					state,
					props: buttonsWrapperProps
				} )
			);
		}

		function createDomButtonsWrapper( { editor, domDocument, state, props } ) {
			const domButtonsWrapper = createElement( domDocument, 'div', {
				class: 'iframe-embed__buttons-wrapper'
			} );
			// TODO these should be cached and we should only clone here these cached nodes!
			const domEditButton = createDomButton( editor, 'edit' );
			const domSaveButton = createDomButton( editor, 'save' );
			const domCancelButton = createDomButton( editor, 'cancel' );

			if ( state.isEditable ) {
				const clonedDomSaveButton = domSaveButton.cloneNode( true );
				const clonedDomCancelButton = domCancelButton.cloneNode( true );

				clonedDomSaveButton.addEventListener( 'click', evt => {
					evt.preventDefault();
					props.onSaveClick();
				} );

				clonedDomCancelButton.addEventListener( 'click', evt => {
					evt.preventDefault();
					props.onCancelClick();
				} );

				domButtonsWrapper.appendChild( clonedDomSaveButton );
				domButtonsWrapper.appendChild( clonedDomCancelButton );
			} else {
				const clonedDomEditButton = domEditButton.cloneNode( true );

				clonedDomEditButton.addEventListener( 'click', evt => {
					evt.preventDefault();
					props.onEditClick();
				} );

				domButtonsWrapper.appendChild( clonedDomEditButton );
			}

			return domButtonsWrapper;
		}

		function createDomTextarea( { domDocument, state, props } ) {
			const domTextarea = createElement( domDocument, 'input', {
				type: 'url',
				placeholder: props.placeholder,
				class: 'ck ck-reset ck-input ck-input-text iframe-embed__source'
			} );

			domTextarea.disabled = props.isDisabled;
			domTextarea.value = state.getRawHtmlValue();

			return domTextarea;
		}

		function createPreviewContainer( { domDocument, state, props, editor } ) {
			const sanitizedOutput = props.sanitizeHtml( state.getRawHtmlValue() );
			const placeholderText =
				state.getRawHtmlValue().length > 0 ?
					t( 'No preview available' ) :
					t( 'Empty embed content' );

			const domPreviewPlaceholder = createElement(
				domDocument,
				'div',
				{
					class: 'ck ck-reset_all iframe-embed__preview-placeholder'
				},
				placeholderText
			);

			const domPreviewContent = createElement( domDocument, 'div', {
				class: 'iframe-embed__preview-content',
				dir: editor.locale.contentLanguageDirection
			} );

			domPreviewContent.innerHTML = `<iframe src="${ sanitizedOutput.html }"></iframe>`;

			const domPreviewContainer = createElement(
				domDocument,
				'div',
				{
					class: 'iframe-embed__preview'
				},
				[ domPreviewPlaceholder, domPreviewContent ]
			);

			return domPreviewContainer;
		}
	}
}

// Returns a toggle mode button DOM element that can be cloned and used in conversion.
//
//	@param {module:utils/locale~Locale} locale Editor locale.
//	@param {'edit'|'save'|'cancel'} type Type of button to create.
//	@returns {iframeElement}
function createDomButton( editor, type ) {
	const t = editor.locale.t;
	const buttonView = new ButtonView( editor.locale );
	const command = editor.commands.get( 'updateIframeEmbed' );

	buttonView.set( {
		tooltipPosition: editor.locale.uiLanguageDirection === 'rtl' ? 'e' : 'w',
		icon: icons.pencil,
		tooltip: true
	} );

	buttonView.render();

	if ( type === 'edit' ) {
		buttonView.set( {
			icon: icons.pencil,
			label: t( 'Edit link' ),
			class: 'iframe-embed__edit-button'
		} );
	} else if ( type === 'save' ) {
		buttonView.set( {
			icon: icons.check,
			label: t( 'Save changes' ),
			class: 'iframe-embed__save-button'
		} );
		buttonView.bind( 'isEnabled' ).to( command, 'isEnabled' );
	} else {
		buttonView.set( {
			icon: icons.cancel,
			label: t( 'Cancel' ),
			class: 'iframe-embed__cancel-button'
		} );
	}

	buttonView.destroy();

	return buttonView.element.cloneNode( true );
}
