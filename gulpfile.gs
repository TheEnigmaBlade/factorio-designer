var gulp = require("gulp")
var plugins = require("gulp-load-plugins")
var runSequence = require("run-sequence")
var rm = require("del")

var pkg = require("./package.json")
var dirs = pkg.directories
var libs = pkg.libraries

gulp.task("clean", {{
	rm([dirs.dist])
}})

gulp.task("copy", [
	"copy:html",
	"copy:css",
	"copy:js",
	"copy:img"
])

gulp.task('copy:html', {{
	gulp.src(
		dirs.src+"/*.html"
	).pipe(
		 plugins().replace(/{{JQUERY_VERSION}}/g, libs.jquery.version)
	).pipe(
		 plugins().replace(/{{VERSION}}/g, pkg.version)
	).pipe(
		gulp.dest(dirs.dist)
	)
}})

gulp.task('copy:css', {{
	gulp.src([
		dirs.src+"/css/**/*.css",
		"!"+dirs.src+"/css/vendor/*.css"
	]).pipe(
		plugins().autoprefixer({
			browsers: ["last 2 versions", "not ie < 11"]
		})
	).pipe(
		gulp.dest(dirs.dist+"/css")
	)
	
	gulp.src([
		dirs.src+"/css/vendor/*.css"
	]).pipe(
		gulp.dest(dirs.dist+"/css/vendor")
	)
}})

gulp.task('copy:js', {{
	gulp.src(
		dirs.src+"/js/**/*.js"
	).pipe(
		gulp.dest(dirs.dist+"/js")
	)
}})

gulp.task('copy:img', {{
	gulp.src([
		dirs.src+"/img/**/*.png",
		dirs.src+"/img/**/*.jpg"
	]).pipe(
		gulp.dest(dirs.dist+"/img")
	)
	
	gulp.src(
		dirs.factorio+"/icons/*.png"
	).pipe(
		gulp.dest(dirs.dist+"/img/icons")
	)
}})

gulp.task("build", {{
    runSequence("copy")
}})

gulp.task("default", ["build"])
