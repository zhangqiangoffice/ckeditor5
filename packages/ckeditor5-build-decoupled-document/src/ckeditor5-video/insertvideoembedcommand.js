/**
 * @module video-embed/insertvideoembedcommand
 */

import { Command } from 'ckeditor5/src/core';
import {
// findOptimalInsertionRange,
// checkSelectionOnObject
} from 'ckeditor5/src/widget';

/**
 * The insert video embed element command.
 *
 * The command is registered by {@link module:video-embed/videoembedediting~VideoEmbedEditing} as `'insertVideoEmbed'`.
 *
 * To insert the video embed element at the current selection, execute the command:
 *
 *		editor.execute( 'insertVideoEmbed' );
 *
 * @extends module:core/command~Command
 */
export default class InsertVideoEmbedCommand extends Command {
	/**
   * @inheritDoc
   */
	refresh() {
		this.isEnabled = isVideoEmbedAllowed( this.editor.model );
	}

	/**
   * Executes the command, which creates and inserts a new video embed element.
   *
   * @fires execute
   */
	execute() {
		const model = this.editor.model;

		model.change( writer => {
			const videoElement = writer.createElement( 'video' );

			model.insertContent( videoElement );
			writer.setSelection( videoElement, 'on' );
		} );
	}
}

// Checks if the `videoEmbed` element can be inserted at the current model selection.
//
// @param {module:engine/model/model~Model} model
// @returns {Boolean}
function isVideoEmbedAllowed( model ) {
	return true;
	// const schema = model.schema;
	// const selection = model.document.selection;

	// return (
	// 	isVideoEmbedAllowedInParent( selection, schema, model ) &&
	// !checkSelectionOnObject( selection, schema )
	// );
}

// Checks if an video embed is allowed by the schema in the optimal insertion parent.
//
// @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
// @param {module:engine/model/schema~Schema} schema
// @param {module:engine/model/model~Model} model Model instance.
// @returns {Boolean}
function isVideoEmbedAllowedInParent( selection, schema, model ) {
	// const parent = getInsertPageBreakParent( selection, model );
	return true;
	// return schema.checkChild( parent, 'video' );
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
