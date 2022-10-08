/**
 * @module video-embed/videoembedui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import videoEmbedIcon from './theme/icons/video.svg';

/**
 * The video embed UI plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class VideoEmbedUI extends Plugin {
	/**
   * @inheritDoc
   */
	static get pluginName() {
		return 'VideoEmbedUI';
	}

	/**
   * @inheritDoc
   */
	init() {
		const editor = this.editor;
		const t = editor.t;

		// Add the `videoEmbed` button to feature components.
		editor.ui.componentFactory.add( 'videoEmbed', locale => {
			const command = editor.commands.get( 'insertVideoEmbed' );
			const view = new ButtonView( locale );

			view.set( {
				label: t( '插入 video' ),
				icon: videoEmbedIcon,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command, 'isEnabled' );

			// Execute the command.
			this.listenTo( view, 'execute', () => {
				editor.execute( 'insertVideoEmbed' );
				editor.editing.view.focus();

				const widgetWrapper =
          editor.editing.view.document.selection.getSelectedElement();

				widgetWrapper.getCustomProperty( 'videoApi' ).makeEditable();
			} );

			return view;
		} );
	}
}
