//   ,:.
//  (:::) Script
//   `-'
// Generated by GuavaScript (guavac) v0.1
// Last modified: 5/27/2016, 3:25:33 AM
var gulp = require("gulp");
var plugins = require("gulp-load-plugins");
var runSequence = require("run-sequence");
var rm = require("del");
var pkg = require("./package.json");
var dirs = pkg.directories;
var libs = pkg.libraries;
gulp.task("clean", function () {
	rm([dirs.dist]);
});
gulp.task("copy", [
	"copy:html",
	"copy:css",
	"copy:js",
	"copy:img"
]);
gulp.task("copy:html", function () {
	var data = require("./src/data.json"), dataAttr = ["range"];
	function replaceData(stream) {
		for (var $$for_00000002$$ = 0; $$for_00000002$$ < Object.keys(data).length; $$for_00000002$$++) {
			var key = Object.keys(data)[$$for_00000002$$];
			for (var $$for_00000001$$ = 0; $$for_00000001$$ < dataAttr.length; $$for_00000001$$++) {
				var attr = dataAttr[$$for_00000001$$];
				var val = data[key][attr];
				if (val !== undefined && val !== null) {
					stream = stream.pipe(plugins().replace(new RegExp("{{" + key + "-" + attr + "}}", "g"), val));
				}
			}
		}
		return stream;
	}
	gulp.src(dirs.src + "/*.html").pipe(plugins().replace(/{{JQUERY_VERSION}}/g, libs.jquery.version)).pipe(plugins().replace(/{{VERSION}}/g, pkg.version)).pipe(plugins().replace(/{{AUTHOR}}/g, pkg.author.name)).pipe(plugins().replace(/{{HOMEPAGE}}/g, pkg.homepage)).pipe(plugins().foreach(function (stream, file) {
		return replaceData(stream);
	})).pipe(gulp.dest(dirs.dist));
});
gulp.task("copy:css", function () {
	gulp.src([
		dirs.src + "/css/**/*.css",
		"!" + dirs.src + "/css/vendor/*.css"
	]).pipe(plugins().autoprefixer({
		browsers: [
			"last 2 versions",
			"not ie < 11"
		]
	})).pipe(gulp.dest(dirs.dist + "/css"));
	gulp.src([dirs.src + "/css/vendor/*.css"]).pipe(gulp.dest(dirs.dist + "/css/vendor"));
});
gulp.task("copy:js", function () {
	gulp.src(dirs.src + "/js/**/*.js").pipe(gulp.dest(dirs.dist + "/js"));
});
gulp.task("copy:img", function () {
	gulp.src([
		dirs.src + "/img/**/*.png",
		dirs.src + "/img/**/*.jpg"
	]).pipe(gulp.dest(dirs.dist + "/img"));
	gulp.src(dirs.factorio + "/icons/*.png").pipe(gulp.dest(dirs.dist + "/img/icons"));
});
gulp.task("build", function () {
	runSequence("copy");
});
gulp.task("default", ["build"]);