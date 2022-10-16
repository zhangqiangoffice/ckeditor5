/**
 * @module video-embed/updatevideoembedcommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The update video embed value command.
 *
 * The command is registered by {@link module:video-embed/videoembedediting~VideoEmbedEditing} as `'updateVideoEmbed'`.
 *
 * To update the value of the video embed element at the current selection, execute the command:
 *
 *		editor.execute( 'updateVideoEmbed', '<b>video.</b>' );
 *
 * @extends module:core/command~Command
 */
export default class UpdateVideoEmbedCommand extends Command {
	/**
   * @inheritDoc
   */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const videoElement = getSelectedRawHtmlModelWidget( selection );

		this.isEnabled = !!videoElement;
	}

	/**
   * Executes the command, which updates the `value` attribute of the embedded video element:
   *
   * @fires execute
   * @param {String} value video as a string.
   */
	execute( value, height, width, align ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedRawHtmlElement = getSelectedRawHtmlModelWidget( selection );

		model.change( writer => {
			writer.setAttribute( 'value', value, selectedRawHtmlElement );
			writer.setAttribute( 'height', height, selectedRawHtmlElement );
			writer.setAttribute( 'width', width, selectedRawHtmlElement );
			writer.setAttribute( 'align', align, selectedRawHtmlElement );
		} );
	}
}

// Returns the selected video embed element in the model, if any.
//
// @param {module:engine/model/selection~Selection} selection
// @returns {module:engine/model/element~Element|null}
function getSelectedRawHtmlModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'element', 'video' ) ) {
		return selectedElement;
	}

	return null;
}
