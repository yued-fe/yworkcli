## 说明

基于gulp任务流的模板和静态资源版本化、combo工具

## 更新

* 2017.12.18 -- 0.1.23 manifest.json里面设置倒序排列, 修复woff2=>woff问题
* 2017.10.19 -- 0.1.22 修复del模块的依赖问题
* 2017.08.21 -- 0.1.21 修复utils/deps.js遍历的bug
* 2017.08.15 优化读取views/output配置
* 2017.07.18 优化rev-hash的速度
* 2017.07.17 修复文件名中出现空格,导致grep出错的问题
* 2017.07.14 修复grep语法问题
* 2017.07.10 修复了生成md5码潜在的bug, 保证了md5的完全正确性.
* 2017.06.29 修复--yconfig传参获取不到的bug, 以及新增yworkflow的配置deps->replaceMD5的配置
* 2017.06.28 增加--build以调用yworkflow编译任务,默认关闭
* 2017.06.28 不再强制--yconfig参数,默认任务目录寻找.yconfig后缀配置文件
* 2017.06.27 新增--deps的参数, 不给js进行md5, 并且lbf.config新增deps和alias
* 2017.06.25 publish的时候会自动调用yworkflow生成新的文件, 需要--yconfig传入项目下的yconfig名
* 2017.06.22 支持ywork.config.json中直接配置hash开关
* 2017.06.15 增加--hash参数,支持生成纯hash版本
* 2017.06.14 增加--skip参数,支持不升级版本号发布
* 2017.06.01 publish默认清理源css中的sourcemap以防冲突

## 安装

安装`npm install -g Yworkcli del-cli@3.0.1`

采用的是全局安装,命令行调用。

## 基础配置

在项目中新建`ywork.config.json`配置文件


```
{
    "static":{
        "path":"build/activity", //生成的项目资源路径
        "gtimgName":"activity", //对应的gtimg地址资源路径
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
    "combo": {
        "force": true,//是否开启combo
        "gtimgTag":"<%= staticConf.domains.static %>",// 静态资源环境配置
        "gtimgNamePrepend":"readnovel", // combo串单独资源路由前置路径
        "uri":"<%= staticConf.domains.static %>/c/=",//combo的线上URL接口
        "logicCondition": "envType == \"pro\" || envType == \"oa\"" //开启combo的条件,注意需要转义双引号
    },
}

```

## 基础使用方法

由于`yworkcli`将核心构建任务完全配置化。可以理解成，通过上面的`ywork.config.json`配置静态资源和views的入口和出口。

项目路径执行`yworkcli --init`会初始化一个配置文件,大家务必按照自己的项目需求来配置。


不再强制约束文件夹格式，适用性更广。只需要保证保证框架机核心`config`配置，静态资源和模板自由度路径自由度更高。


#### 发布

在项目目录下(有`ywork.config.json`)，执行`yworkcli --publish --log './ywork.log'`

`--log {日志相对路径}`可以自定义日志，方便调试。

#### 不升版本发布

执行`yworkcli --publish --skip`，即可强制不生版本发布。

#### 生成HASH资源版本

执行`yworkcli --publish --hash`，即可生成hash版本,默认hash长度为5位。

#### 自带执行yworkflow功能
执行`yworkcli --publish --yconfig ${proj.yconfig}`

#### 在--hash里面新加参数--deps,生成deps和alias功能
带deps的参数, 会在hash-tag-map生成一个deps.json和alias.json
同时views里面需要新增如下配置
```javascript
LBF.config({
    deps: <%= lbf.deps %>
});
LBF.config({
    alias: <%= lbf.alias %>
});
```
在完成之后<%= lbf.deps %>和<%= lbf.alias %>会被替换成对应的json
执行`yworkcli --publish --yconfig ${proj.yconfig} --hash --deps`

#### 新增deps:replaceMD5方法
因为--deps方式,将页面的js都不使用带版本的js替换了,但是部分js还是需要替换,所以在ywork.config.json新增了一个deps:replaceMD5的配置, 使用的是glob格式语法.
```
{
    "static":{
        "path":"build/activity", //生成的项目资源路径
        "gtimgName":"activity", //对应的gtimg地址资源路径
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
    "combo": {
        "force": true,//是否开启combo
        "gtimgTag":"<%= staticConf.domains.static %>",// 静态资源环境配置
        "gtimgNamePrepend":"readnovel", // combo串单独资源路由前置路径
        "uri":"<%= staticConf.domains.static %>/c/=",//combo的线上URL接口
        "logicCondition": "envType == \"pro\" || envType == \"oa\"" //开启combo的条件,注意需要转义双引号
    },
    "deps": {
        "replaceMD5": ["!**/*.js", "**/sprite.js", "**/sprite.*.js"] // 除了sprite.js和sprite.*.js以外,所有的js都不参与MD5的替换
    }
}
```



