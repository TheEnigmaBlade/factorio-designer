import gulp from "gulp"
import plugins from "gulp-load-plugins"
import runSequence from "run-sequence"
var rm = require("del")
import glob from "glob"

import pkg from "./package.json"
var dirs = pkg.directories
var libs = pkg.libraries

gulp.task("clean", {{:done:
	rm([dirs.dist]).then(done)
}})

gulp.task("copy", [
	"copy:html"
])

gulp.task('copy:html', {{
	gulp.src(
		dirs.src+"/*.html"
	).pipe(
		 plugins().replace(/{{JQUERY_VERSION}}/g, libs.jquery.version)
	).pipe(
		gulp.dest(dirs.dist)
	)
}})

gulp.task("build", {{:done:
    runSequence("clean", "copy", done)
}})

gulp.task("default", ["build"])
