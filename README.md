# 起点改造 前端构建cli工具


##安装

安装`npm install -g Yworkcli del-cli`

采用的是全局安装,命令行调用。

##基础配置

在项目中新建`ywork.config.json`配置文件


```
{
    "static":{
        "path":"build/activity", //生成的项目资源路径        "gtimgName":"activity", //对应的gtimg地址资源路径
        "svn":"",
        "output":"_prelease" //本地输出的编译后路径
    },
    "views":{
        "path":"src/views", //匹配的模板文件路径
        "output":"_previews"//最终生成的目录文件路劲
    },
    "configs":{
        "path":"src/node--config",//框架机config路径
        "output":"_prelease"//框架集config发布路径
    },
    "combo":{
        "force":true //是否强制开启combo:默认开启
    }
}




```


##基础使用方法

由于`yworkcli`是讲构建任务完全配置化。可以理解成，通过上面的`ywork.config.json`配置静态资源和views的入口和出口。

不再强制约束文件夹格式，适用性更广。只需要保证保证框架机核心`config`配置，静态资源和模板自由度路径自由度更高。

####发布

在项目目录下(有`ywork.config.json`)，执行`yworkcli --publish --log './ywork.log'`

`--log {日志相对路径}`可以自定义日志，方便调试。



