
/**
 * @module iframe-embed/updateiframeembedcommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The update iframe embed value command.
 *
 * The command is registered by {@link module:iframe-embed/iframeembedediting~IframeEmbedEditing} as `'updateIframeEmbed'`.
 *
 * To update the value of the iframe embed element at the current selection, execute the command:
 *
 *		editor.execute( 'updateIframeEmbed', '<b>iframe.</b>' );
 *
 * @extends module:core/command~Command
 */
export default class UpdateIframeEmbedCommand extends Command {
	/**
   * @inheritDoc
   */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const iframeElement = getSelectedRawHtmlModelWidget( selection );

		this.isEnabled = !!iframeElement;
	}

	/**
   * Executes the command, which updates the `value` attribute of the embedded iframe element:
   *
   * @fires execute
   * @param {String} value iframe as a string.
   */
	execute( value ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedRawHtmlElement = getSelectedRawHtmlModelWidget( selection );

		model.change( writer => {
			writer.setAttribute( 'value', value, selectedRawHtmlElement );
		} );
	}
}

// Returns the selected iframe embed element in the model, if any.
//
// @param {module:engine/model/selection~Selection} selection
// @returns {module:engine/model/element~Element|null}
function getSelectedRawHtmlModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'element', 'iframe' ) ) {
		return selectedElement;
	}

	return null;
}
