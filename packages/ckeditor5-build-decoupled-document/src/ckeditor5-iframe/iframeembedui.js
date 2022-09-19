/**
 * @module iframe-embed/iframeembedui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import iframeEmbedIcon from './theme/icons/iframe.svg';

/**
 * The iframe embed UI plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class IframeEmbedUI extends Plugin {
	/**
   * @inheritDoc
   */
	static get pluginName() {
		return 'IframeEmbedUI';
	}

	/**
   * @inheritDoc
   */
	init() {
		const editor = this.editor;
		const t = editor.t;

		// Add the `iframeEmbed` button to feature components.
		editor.ui.componentFactory.add( 'iframeEmbed', locale => {
			const command = editor.commands.get( 'insertIframeEmbed' );
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Embed link' ),
				icon: iframeEmbedIcon,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command, 'isEnabled' );

			// Execute the command.
			this.listenTo( view, 'execute', () => {
				editor.execute( 'insertIframeEmbed' );
				editor.editing.view.focus();

				const widgetWrapper =
          editor.editing.view.document.selection.getSelectedElement();

				widgetWrapper.getCustomProperty( 'iframeApi' ).makeEditable();
			} );

			return view;
		} );
	}
}
