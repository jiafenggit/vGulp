# vGulp

> gulp、gulp ejs、gulp clean、gulp watch 默认处理的lang为zh

- gulp          开发，添加命令 --lang= 可以指定语言，例：gulp --lang=en
- gulp help     gulp参数说明
- gulp build    打包
- gulp ejs      ejs模板编译
- gulp sass     sass编译
- gulp clean    清理无用文件
- gulp watch    监听文件改变

config 目录说明:

`
	{
	    "project" : "vGulp",     
	    "localserver" : {       //  本地服务器设置
	        "host" : "localhost",
	        "port" : "8081"
	    },
	    "displayInfo": false,   //  是否在css，js中展示作者信息,默认不展示
	    "pkg": {            // 作者信息配置
	        "author":"",
	        "description":"",
	        "version":"1.0.0",
	        "homepage":"#",
	        "license":""
	    },              
	    "replaceWord": {  //  打包中全局替换文字
	        "origin": "",
	        "dist": ""
	    },
	    "concatCssFiles": {     // 合并css文件
	        "filename": "init.min.css",     // 合并后的文件名
	        "folder": "common",     // 文件目录
	        "files": ["init.css","header.css"]   // 合并文件的顺序，文件名越前合并后的代码在越前面
	    }    
	}
`