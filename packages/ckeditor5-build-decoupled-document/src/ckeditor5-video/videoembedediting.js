/**
 * @module video-embed/videoembedediting
 */

import { Plugin, icons } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';
import { toWidget } from 'ckeditor5/src/widget';
import { logWarning, createElement } from 'ckeditor5/src/utils';

import InsertVideoEmbedCommand from './insertvideoembedcommand';
import UpdateVideoEmbedCommand from './updatevideoembedcommand';

import './theme/lark.css';
import './theme/videoembed.css';

/**
 * The video embed editing feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class VideoEmbedEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'VideoEmbedEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'videoEmbed', {
			showPreviews: false,
			sanitizeHtml: videoHtml => {
				/**
				 * When using the video embed feature with the `videoEmbed.showPreviews=true` option, it is strongly recommended to
				 * define a sanitize function that will clean up the input video in order to avoid XSS vulnerability.
				 *
				 * For a detailed overview, check the {@glink features/video-embed video embed feature} documentation.
				 *
				 * @error video-embed-provide-sanitize-function
				 */
				logWarning( 'video-embed-provide-sanitize-function' );

				return {
					html: videoHtml,
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

		schema.register( 'video', {
			isObject: true,
			allowWhere: '$block',
			allowAttributes: [ 'value', 'height', 'width', 'align' ]
		} );

		editor.commands.add(
			'updateVideoEmbed',
			new UpdateVideoEmbedCommand( editor )
		);
		editor.commands.add(
			'insertVideoEmbed',
			new InsertVideoEmbedCommand( editor )
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

		const videoEmbedConfig = editor.config.get( 'videoEmbed' );

		editor.conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'figure',
				classes: 'video-embed'
			},
			model: ( viewElement, { writer } ) => {
				// The figure.video-embed is registered as a raw content element,
				// so all it's content is available in a custom property.
				return writer.createElement( 'video', {
					value: viewElement.getChild( 0 ).getAttribute( 'src' ),
					height: viewElement.getChild( 0 ).getAttribute( 'height' ),
					width: viewElement.getChild( 0 ).getAttribute( 'width' ),
					align: viewElement.getStyle( 'justify-content' ) || 'center'
				} );
			}
		} );

		editor.conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'video',
			view: ( modelElement, { writer } ) => {
				const url = modelElement.getAttribute( 'value' ) || '';
				const height = modelElement.getAttribute( 'height' ) || 'auto';
				const width = modelElement.getAttribute( 'width' ) || 'auto';
				const align = modelElement.getAttribute( 'align' ) || 'center';
				const embedElement = writer.createContainerElement( 'figure', {
					class: 'video-embed',
					style: `justify-content: ${ align }`
				} );
				writer.insert(
					writer.createPositionAt( embedElement, 0 ),
					writer.createRawElement( 'video', { controls: true, src: url, height, width }, function( domElement ) {
						domElement.innerHTML = `<source src="${ url }" type="video/mp4">
						<source src="${ url }" type="video/ogg">
						<source src="${ url }" type="video/webm">`;
					} )
				);
				return embedElement;
			}
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			triggerBy: {
				attributes: [ 'value', 'height', 'width', 'align' ]
			},
			model: 'video',
			view: ( modelElement, { writer } ) => {
				let domContentWrapper, state, props;

				const viewContainer = writer.createContainerElement( 'figure', {
					class: 'video-embed',
					'data-video-embed-label': t( 'Video 资源地址' ),
					dir: editor.locale.uiLanguageDirection
				} );

				// Widget cannot be a raw element because the widget system would not be able
				// to add its UI to it. Thus, we need this wrapper.
				const viewContentWrapper = writer.createRawElement(
					'div',
					{
						class: 'video-embed__content-wrapper'
					},
					function( domElement ) {
						domContentWrapper = domElement;

						renderContent( { domElement, editor, state, props } );

						// Since there is a `data-cke-ignore-events` attribute set on the wrapper element in the editable mode,
						// the explicit `mousedown` handler on the `capture` phase is needed to move the selection onto the whole
						// video embed widget.
						domContentWrapper.addEventListener(
							'mousedown',
							() => {
								if ( state.isEditable ) {
									const model = editor.model;
									const selectedElement =
										model.document.selection.getSelectedElement();

									// Move the selection onto the whole video embed widget if it's currently not selected.
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

				// API exposed on each raw video embed widget so other features can control a particular widget.
				const videoApi = {
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
					save( newValue, newHeight, newWidth, newAlign ) {
						// If the value didn't change, we just cancel. If it changed,
						// it's enough to update the model – the entire widget will be reconverted.
						if ( newValue !== state.getRawHtmlValue() ||
						newHeight !== state.getRawHtmlHeight() ||
						newWidth !== state.getRawHtmlWidth() ||
						newAlign != state.getRawHtmlAlign() ) {
							editor.execute( 'updateVideoEmbed', newValue, newHeight, newWidth, newAlign );
							this.cancel();
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
					showPreviews: videoEmbedConfig.showPreviews,
					isEditable: false,
					getRawHtmlValue: () => modelElement.getAttribute( 'value' ) || '',
					getRawHtmlHeight: () => modelElement.getAttribute( 'height' ) || 'auto',
					getRawHtmlWidth: () => modelElement.getAttribute( 'width' ) || 'auto',
					getRawHtmlAlign: () => modelElement.getAttribute( 'align' ) || 'center'
				};

				props = {
					sanitizeHtml: videoEmbedConfig.sanitizeHtml,
					textareaPlaceholder: t( '输入 video 的资源地址，例如：https://.../demo.mp4' ),

					onEditClick() {
						videoApi.makeEditable();
					},
					onSaveClick( newValue, newHeight, newWidth, newAlign ) {
						videoApi.save( newValue, newHeight, newWidth, newAlign );
					},
					onCancelClick() {
						videoApi.cancel();
					}
				};

				writer.insert(
					writer.createPositionAt( viewContainer, 0 ),
					viewContentWrapper
				);

				writer.setCustomProperty( 'videoApi', videoApi, viewContainer );
				writer.setCustomProperty( 'video', true, viewContainer );

				return toWidget( viewContainer, writer, {
					widgetLabel: t( 'Video 资源地址' ),
					hasSelectionHandle: true
				} );
			}
		} );

		function renderContent( { domElement, editor, state, props } ) {
			// Remove all children;
			domElement.textContent = '';

			const domDocument = domElement.ownerDocument;
			let domTextarea;
			let domInputHeight;
			let domInputWidth;
			let domSelectAlign;

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

				const domLabelHeight = createDomLabel( domDocument, '高度' );

				domInputHeight = createDomInput( {
					domDocument,
					props: {
						isDisabled: false,
						value: state.getRawHtmlHeight()
					}
				} );

				const domLabelWidth = createDomLabel( domDocument, '宽度' );

				domInputWidth = createDomInput( {
					domDocument,
					props: {
						isDisabled: false,
						value: state.getRawHtmlWidth()
					}
				} );

				const domLabeAlign = createDomLabel( domDocument, '布局' );

				domSelectAlign = createDomSelect( {
					domDocument,
					props: {
						isDisabled: false,
						value: state.getRawHtmlAlign()
					}
				} );

				const domFormWrapper = createElement(
					domDocument,
					'div',
					{ class: 'video_form_wrapper' },
					[ domLabelHeight, domInputHeight, domLabelWidth, domInputWidth, domLabeAlign, domSelectAlign ]
				);

				domElement.append( domTextarea );
				domElement.append( domFormWrapper );
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
					props.onSaveClick( domTextarea.value, domInputHeight.value, domInputWidth.value, domSelectAlign.value );
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
				class: 'video-embed__buttons-wrapper'
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
				class: 'ck ck-reset ck-input ck-input-text video-embed__source'
			} );

			domTextarea.disabled = props.isDisabled;
			domTextarea.value = state.getRawHtmlValue();

			return domTextarea;
		}

		function createDomInput( { domDocument, props } ) {
			const domInput = createElement( domDocument, 'input', {
				type: 'text',
				placeholder: '例如：300px ，或者 auto',
				class: 'ck ck-reset ck-input ck-input-text video-embed_style'
			} );

			domInput.disabled = props.isDisabled;
			domInput.value = props.value;

			return domInput;
		}

		function createDomSelect( { domDocument, props } ) {
			function createDomOptions( label, value ) {
				return createElement( domDocument, 'option', {
					value
				}, label );
			}

			const domSelect = createElement( domDocument, 'select', {
				name: 'align',
				placeholder: '请选择',
				class: 'ck ck-reset ck-input ck-input-text video-embed_align'
			} );

			domSelect.append( createDomOptions( '居左', 'left' ) );
			domSelect.append( createDomOptions( '居中', 'center' ) );
			domSelect.append( createDomOptions( '居右', 'right' ) );
			domSelect.disabled = props.isDisabled;
			domSelect.value = props.value;

			return domSelect;
		}

		function createDomLabel( domDocument, label ) {
			return createElement( domDocument, 'span', { class: 'video_style_label' }, `${ label }：` );
		}

		function createPreviewContainer( { domDocument, state, props, editor } ) {
			const sanitizedOutput = props.sanitizeHtml( state.getRawHtmlValue() );
			const sanitizedOutputHeight = props.sanitizeHtml( state.getRawHtmlHeight() );
			const sanitizedOutputWidth = props.sanitizeHtml( state.getRawHtmlWidth() );
			const sanitizedOutputAlign = props.sanitizeHtml( state.getRawHtmlAlign() );
			const placeholderText =
				state.getRawHtmlValue().length > 0 ?
					t( 'No preview available' ) :
					t( 'Empty embed content' );

			const domPreviewPlaceholder = createElement(
				domDocument,
				'div',
				{
					class: 'ck ck-reset_all video-embed__preview-placeholder'
				},
				placeholderText
			);

			const domPreviewContent = createElement( domDocument, 'div', {
				class: 'video-embed__preview-content',
				dir: editor.locale.contentLanguageDirection,
				style: `justify-content: ${ sanitizedOutputAlign.html }`
			} );

			domPreviewContent.innerHTML = `<video controls height="${ sanitizedOutputHeight.html }" width="${ sanitizedOutputWidth.html }">
												<source src="${ sanitizedOutput.html }" type="video/mp4">
												<source src="${ sanitizedOutput.html }" type="video/ogg">
												<source src="${ sanitizedOutput.html }" type="video/webm">
											</video>`;

			const domPreviewContainer = createElement(
				domDocument,
				'div',
				{
					class: 'video-embed__preview'
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
//	@returns {videoElement}
function createDomButton( editor, type ) {
	const t = editor.locale.t;
	const buttonView = new ButtonView( editor.locale );
	const command = editor.commands.get( 'updateVideoEmbed' );

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
			class: 'video-embed__edit-button'
		} );
	} else if ( type === 'save' ) {
		buttonView.set( {
			icon: icons.check,
			label: t( 'Save changes' ),
			class: 'video-embed__save-button'
		} );
		buttonView.bind( 'isEnabled' ).to( command, 'isEnabled' );
	} else {
		buttonView.set( {
			icon: icons.cancel,
			label: t( 'Cancel' ),
			class: 'video-embed__cancel-button'
		} );
	}

	buttonView.destroy();

	return buttonView.element.cloneNode( true );
}
