"use strict"

const gulp = require('gulp'),
    opn = require('opn'),
    path = require('path'),
    fs = require('fs'),
    $ = require('gulp-load-plugins')(),
    connect = require('gulp-connect'),
    pngquant = require('imagemin-pngquant'),
    argv = require('yargs').argv,
    config = require('./config.json'),
    browserSync = require('browser-sync');
// 头部信息
const pkg = config.pkg;
const banner = ['/**',
    ' * @author: <%= pkg.author %>',
    ' * @description: <%= pkg.description %>',
    ' * @version: v<%= pkg.version %>',
    ' * @homepage: <%= pkg.homepage %>',
    ' * @license: <%= pkg.license %>',
    ' */',
    ''].join('\n');
const lang = argv.lang || 'zh';
const src = {
    ejs: 'src/ejs',    // 指定ejs目录
    sass: 'src/sass',
    images: 'src/images/**',
    js: 'src/js/**',
    css: 'src/css',  // sass的输出目录
    font: 'src/font/**',
    source: 'src/source/**',    // 其他文件（音乐，视频等）
    // data: 'src/data',    // ejs编译方式一：数据文件目录
    data: 'data.json'          // ejs编译方式二：数据文件
}
const dist = {
    html: 'html',
    js: 'static/js',
    css: 'static/css',
    images: 'static/images',
    font: 'static/font',
    source: 'static/source'
}
// 任务，将根据key值生成 gulp 任务
const tasks = {
    ejs: function() {   // ejs 模板编译
        return gulp.src(src.ejs + '/*.ejs')
            .pipe($.data(function (file) {
                const filePath = file.path;
                /* 方式一：一个页面对应一个json，另外定义一个全局的global.json文件 */
                /*const cur = src.data + '/' + lang + '/' + path.basename(filePath, '.html') + '.json';
                let global_json = {};
                if(fs.existsSync(src.data + '/global.json')) {
                    global_json = {global: JSON.parse(fs.readFileSync(src.data + '/global.json'))}
                } else {
                    throw src.data + '/global.json 文件不存在';
                }
                return fs.existsSync(cur) ? Object.assign(global_json, JSON.parse(fs.readFileSync(cur)), {_lang:lang}) : global_json*/
                /* 方式二：所有页面使用同一个data.json文件 */
                if(fs.existsSync(src.data)) {
                    let json_data = JSON.parse(fs.readFileSync(src.data))[lang];
                    return Object.assign({global: json_data['global']}, json_data[path.basename(filePath, '.ejs')], {_lang:lang});
                } else {
                    throw src.data + '文件不存在';
                }
            }))
            .pipe($.ejs({},{},{ext: '.html'}).on('error', function(err) {
                $.util.log(err);
                this.emit('end');
            }))
            .pipe(gulp.dest('src/'+lang))
            .pipe(connect.reload());
    },
    sass: function() { // SASS 代码编译、合并
        const concatCss = config.concatCssFiles,
            files = concatCss.files.map(function(item) {
                return '**/' + item;
            }),
            f = $.filter(files,{restore: true});
        return gulp.src(src.sass + '/**')
            .pipe($.plumber())
            .pipe($.compass({
                css: src.css,
                sass: src.sass
            }))
            .pipe(f)
            .pipe($.order(files))
            .pipe($.concat(concatCss.filename))
            .pipe(f.restore)
            .pipe($.autoprefixer({
                browsers: ['last 2 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],
                cascade: false, //是否美化属性值 默认：true 像这样:
                //-webkit-transform: rotate(45deg);
                //        transform: rotate(45deg);
                remove:true //是否去掉不必要的前缀 默认：true
            }))
            .pipe(gulp.dest(src.css))
            .pipe(connect.reload());
    },
    js: function() {    // js
        gulp.src(src.js)
            .pipe(connect.reload())
    },
    clean: function() { // 多余文件删除
        return gulp.src('./.sass-cache')
            .pipe($.clean({force: true}))
            .pipe(gulp.dest('./clean'));
    },
    watch: function() {     // 文件监控
        gulp.watch([src.sass + '/**'], ['sass']);
        gulp.watch([src.data,src.ejs + '/**'], ['ejs']);
        // gulp.watch([src.data + '/**',src.ejs + '/**'], ['ejs']);
        gulp.watch([src.js], ['js']);
    }
}
// 生成 gulp 任务
Object.keys(tasks).forEach(function(key) {
    gulp.task(key, function() {
        return tasks[key]()
    });
});
// 打包
const build = {
    html: function() {
        const html = $.filter(['**/en/*.html','**/zh/*.html']);
        return gulp.src('src/**/*.html')
            .pipe(html)
            .pipe($.replace(config.replaceWord.origin,config.replaceWord.dist))     //- 执行文件内css名的替换
            .pipe(gulp.dest(dist.html)); 
    },
    js: function() {
        return gulp.src(src.js)
            .pipe($.replace(config.replaceWord.origin,config.replaceWord.dist))
            .pipe($.uglify())
            .pipe($.if(config.displayInfo, $.header(banner, { pkg : pkg } )))
            .pipe(gulp.dest(dist.js));
    },
    css: function() {
        const file = $.filter(['**','!*' + config.concatCssFiles.folder],{restore: true});
        return gulp.src(src.css + '/*.css')
            .pipe(file)
            .pipe($.replace(config.replaceWord.origin,config.replaceWord.dist))
            .pipe($.cleanCss())
            .pipe($.if(config.displayInfo, $.header(banner, { pkg : pkg } )))
            .pipe(gulp.dest(dist.css));
    },
    img: function() {
        return gulp.src(src.images)
            .pipe($.imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()]
            }))
            .pipe(gulp.dest(dist.images));
    },
    font: function() {
        return gulp.src(src.font)
            .pipe(gulp.dest(dist.font));
    },
    other: function() {
        return gulp.src(src.source)
            .pipe(gulp.dest(dist.source));
    }
}
//默认任务
gulp.task('default', ['sass', 'ejs', 'watch'], function(){
    console.log('请开始编写你的代码！');
    // 开启本地 Web 服务器功能
    connect.server({
        livereload: true,
        port: config.localserver.port
    });
    //  通过浏览器打开本地 Web服务器 路径
    opn( 'http://' + config.localserver.host + ':' + config.localserver.port + '/src/'+ lang +'/' );
});
//将相关项目文件复制到dist 文件夹下 并压缩
gulp.task('build', ['sass', 'ejs', 'js', 'clean'], function(){
    console.log('正在打包你的代码！');
    for(let key in build) {
        build[key]();
    }
});
gulp.task('help',function () {
    console.log('gulp任务命令：')
    console.log('    gulp help     gulp参数说明');
    console.log('    gulp          开发，添加命令 --lang= 可以指定语言，例：gulp --lang=en');
    console.log('    gulp build    打包');
    console.log('    gulp ejs      ejs模板编译');
    console.log('    gulp sass     sass编译');
    console.log('    gulp clean    清理无用文件');
    console.log('    gulp watch    监听文件改变');
});
