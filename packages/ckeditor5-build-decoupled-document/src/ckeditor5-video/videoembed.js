/**
 * @module video-embed/videoembed
 */

import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import VideoEmbedEditing from './videoembedediting';
import VideoEmbedUI from './videoembedui';

/**
 * The video embed feature.
 *
 * It allows inserting video snippets directly into the editor.
 *
 * For a detailed overview, check the {@glink features/video-embed video embed feature} documentation.
 *
 * @extends module:core/plugin~Plugin
 */
export default class VideoEmbed extends Plugin {
	/**
   * @inheritDoc
   */
	static get requires() {
		return [ VideoEmbedEditing, VideoEmbedUI, Widget ];
	}

	/**
   * @inheritDoc
   */
	static get pluginName() {
		return 'VideoEmbed';
	}
}

/**
 * The configuration of the video embed feature.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				videoEmbed: ... // video embed feature options.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface VideoEmbedConfig
 */

/**
 * Whether the feature should render previews of the embedded video.
 *
 * When set to `true`, the feature will produce a preview of the inserted video based on a sanitized
 * version of the video provided by the user.
 *
 * The function responsible for sanitizing the video needs to be specified in
 * {@link module:video-embed/videoembed~VideoEmbedConfig#sanitizeHtml `config.videoEmbed.sanitizeHtml()`}.
 *
 * Read more about the security aspect of this feature in the {@glink features/video-embed#security "Security"} section of
 * the {@glink features/video-embed video embed} feature guide.
 *
 * @member {Boolean} [module:video-embed/videoembed~VideoEmbedConfig#showPreviews=false]
 */

/**
 * Callback used to sanitize the video provided by the user when generating previews of it in the editor.
 *
 * We strongly recommend overwriting the default function to avoid XSS vulnerabilities.
 *
 * Read more about the security aspect of this feature in the {@glink features/video-embed#security "Security"} section of
 * the {@glink features/video-embed video embed} feature guide.
 *
 * The function receives the input video (as a string), and should return an object
 * that matches the {@link module:video-embed/videoembed~VideoEmbedSanitizeOutput} interface.
 *
 *  	ClassicEditor
 * 			.create( editorElement, {
 * 				videoEmbed: {
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
 * {@link module:video-embed/videoembed~VideoEmbedConfig#showPreviews is configured to render previews}.
 *
 * @member {Function} [module:video-embed/videoembed~VideoEmbedConfig#sanitizeHtml]
 */

/**
 * An object returned by the {@link module:video-embed/videoembed~VideoEmbedConfig#sanitizeHtml} function.
 *
 * @interface VideoEmbedSanitizeOutput
 */

/**
 * An output (safe) video that will be inserted into the {@glink framework/guides/architecture/editing-engine editing view}.
 *
 * @member {String} module:video-embed/videoembed~VideoEmbedSanitizeOutput#html
 */

/**
 * A flag that indicates whether the output video is different than the input value.
 *
 * @member {Boolean} [module:video-embed/videoembed~VideoEmbedSanitizeOutput#hasChanged]
 */
