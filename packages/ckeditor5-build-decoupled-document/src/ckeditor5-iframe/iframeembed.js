/**
 * @module iframe-embed/iframeembed
 */

import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import IframeEmbedEditing from './iframeembedediting';
import IframeEmbedUI from './iframeembedui';

/**
 * The iframe embed feature.
 *
 * It allows inserting iframe snippets directly into the editor.
 *
 * For a detailed overview, check the {@glink features/iframe-embed iframe embed feature} documentation.
 *
 * @extends module:core/plugin~Plugin
 */
export default class IframeEmbed extends Plugin {
	/**
   * @inheritDoc
   */
	static get requires() {
		return [ IframeEmbedEditing, IframeEmbedUI, Widget ];
	}

	/**
   * @inheritDoc
   */
	static get pluginName() {
		return 'IframeEmbed';
	}
}

/**
 * The configuration of the iframe embed feature.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				iframeEmbed: ... // iframe embed feature options.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface IframeEmbedConfig
 */

/**
 * Whether the feature should render previews of the embedded iframe.
 *
 * When set to `true`, the feature will produce a preview of the inserted iframe based on a sanitized
 * version of the iframe provided by the user.
 *
 * The function responsible for sanitizing the iframe needs to be specified in
 * {@link module:iframe-embed/iframeembed~IframeEmbedConfig#sanitizeHtml `config.iframeEmbed.sanitizeHtml()`}.
 *
 * Read more about the security aspect of this feature in the {@glink features/iframe-embed#security "Security"} section of
 * the {@glink features/iframe-embed iframe embed} feature guide.
 *
 * @member {Boolean} [module:iframe-embed/iframeembed~IframeEmbedConfig#showPreviews=false]
 */

/**
 * Callback used to sanitize the iframe provided by the user when generating previews of it in the editor.
 *
 * We strongly recommend overwriting the default function to avoid XSS vulnerabilities.
 *
 * Read more about the security aspect of this feature in the {@glink features/iframe-embed#security "Security"} section of
 * the {@glink features/iframe-embed iframe embed} feature guide.
 *
 * The function receives the input iframe (as a string), and should return an object
 * that matches the {@link module:iframe-embed/iframeembed~IframeEmbedSanitizeOutput} interface.
 *
 *  	ClassicEditor
 * 			.create( editorElement, {
 * 				iframeEmbed: {
 * 					showPreviews: true,
 * 					sanitizeHtml( inputHtml ) {
 * 						// Strip unsafe elements and attributes, e.g.:
 * 						// the `<script>` elements and `on*` attributes.
 * 						const outputHtml = sanitize( inputHtml );
 *
 * 						return {
 * 							html: outputHtml,
 *							// true or false depending on whether the sanitizer stripped anything.
 * 							hasChanged: ...
 * 						};
 * 					},
 * 				}
 * 			} )
 * 			.then( ... )
 * 			.catch( ... );
 *
 * **Note:** The function is used only when the feature
 * {@link module:iframe-embed/iframeembed~IframeEmbedConfig#showPreviews is configured to render previews}.
 *
 * @member {Function} [module:iframe-embed/iframeembed~IframeEmbedConfig#sanitizeHtml]
 */

/**
 * An object returned by the {@link module:iframe-embed/iframeembed~IframeEmbedConfig#sanitizeHtml} function.
 *
 * @interface IframeEmbedSanitizeOutput
 */

/**
 * An output (safe) iframe that will be inserted into the {@glink framework/guides/architecture/editing-engine editing view}.
 *
 * @member {String} module:iframe-embed/iframeembed~IframeEmbedSanitizeOutput#html
 */

/**
 * A flag that indicates whether the output iframe is different than the input value.
 *
 * @member {Boolean} [module:iframe-embed/iframeembed~IframeEmbedSanitizeOutput#hasChanged]
 */
