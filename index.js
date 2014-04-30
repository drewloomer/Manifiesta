var path = require('path'),
	fs = require('fs'),
	gutil = require('gulp-util'),
	through = require('through'),
	assign = require('object-assign'),
	chalk = require('chalk'),
	Buffer = require('buffer').Buffer;


module.exports = function (fileName, options) {

	'use strict';

	options = assign({}, options || {});
	fileName = fileName || 'manifest.json';

	var manifest = {},
		base = path.resolve(path.normalize(options.base)) || '',
		ignore = options.ignore || [],
		indent = options.indent || '\t';

	function bufferManifest(file) {

		var filePath = file.path.replace(base, ''),
			filePieces = filePath.split(path.sep),
			currentManifestNode,
			i = 0,
			j = 0,
			len = filePieces.length,
			piece = '',
			fileInfo;

		// Make sure there is a file and it's not ignored
		if (file.isNull()) {
			return;
		}

		// Not supporting this
		if (file.isStream()) {
			return this.emit('error', new gutil.PluginError('manifiesta', 'Streaming not supported'));
		}

		// Loop through the pieces to create the tree
		for (i = 0; i < len; i++) {

			// The path piece
			piece = filePieces[i];

			// Make sure it's not an empty string
			if (piece) {

				// If we aren't working on a node of the manifest tree yet, start at the root
				if (!currentManifestNode) {
					currentManifestNode = manifest;
				}

				// If this isn't the last piece, just add it as a node on the manifest if it doesn't already exist
				if (i !== len - 1) {
					if (!currentManifestNode[piece]) {
						currentManifestNode[piece] = {};
					}
					currentManifestNode = currentManifestNode[piece];
				}
				else {
					// console.log(file.stat);
					currentManifestNode[piece] = {
						size: file.stat.size
					};
				}
			}
		}
	}

	function endStream() {

		var joinedPath = path.join(base, fileName),
			newFile = new gutil.File({
				cwd: base,
				base: base,
				path: joinedPath,
				contents: new Buffer(JSON.stringify(manifest, null, indent))
			});

		this.emit('data', newFile);
		this.emit('end');
	}

	return through(bufferManifest, endStream);
};
