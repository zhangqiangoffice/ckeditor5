
/**
 * @module iframe-embed/insertiframeembedcommand
 */

import { Command } from 'ckeditor5/src/core';
import {
// findOptimalInsertionRange,
// checkSelectionOnObject
} from 'ckeditor5/src/widget';

/**
 * The insert iframe embed element command.
 *
 * The command is registered by {@link module:iframe-embed/iframeembedediting~IframeEmbedEditing} as `'insertIframeEmbed'`.
 *
 * To insert the iframe embed element at the current selection, execute the command:
 *
 *		editor.execute( 'insertIframeEmbed' );
 *
 * @extends module:core/command~Command
 */
export default class InsertIframeEmbedCommand extends Command {
	/**
   * @inheritDoc
   */
	refresh() {
		this.isEnabled = isIframeEmbedAllowed( this.editor.model );
	}

	/**
   * Executes the command, which creates and inserts a new iframe embed element.
   *
   * @fires execute
   */
	execute() {
		const model = this.editor.model;

		model.change( writer => {
			const iframeElement = writer.createElement( 'iframe' );

			model.insertContent( iframeElement );
			writer.setSelection( iframeElement, 'on' );
		} );
	}
}

// Checks if the `iframeEmbed` element can be inserted at the current model selection.
//
// @param {module:engine/model/model~Model} model
// @returns {Boolean}
function isIframeEmbedAllowed( model ) {
	return true;
	// const schema = model.schema;
	// const selection = model.document.selection;

	// return (
	// 	isIframeEmbedAllowedInParent( selection, schema, model ) &&
	// !checkSelectionOnObject( selection, schema )
	// );
}

// Checks if an iframe embed is allowed by the schema in the optimal insertion parent.
//
// @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
// @param {module:engine/model/schema~Schema} schema
// @param {module:engine/model/model~Model} model Model instance.
// @returns {Boolean}
function isIframeEmbedAllowedInParent( selection, schema, model ) {
	// const parent = getInsertPageBreakParent( selection, model );
	return true;
	// return schema.checkChild( parent, 'iframe' );
}

// Returns a node that will be used to insert a page break with `model.insertContent` to check if a html embed element can be placed there.
//
// @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
// @param {module:engine/model/model~Model} model Model instance.
// @returns {module:engine/model/element~Element}
// function getInsertPageBreakParent( selection, model ) {
// 	const insertAt = findOptimalInsertionRange( selection, model );

// 	const parent = insertAt.parent;

// 	if ( parent && parent.isEmpty && !parent.is( 'element', '$root' ) ) {
// 		return parent.parent;
// 	}

// 	return parent;
// }
