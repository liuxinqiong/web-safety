安全的定义
1. 私密性：不被非法获取和利用
2. 可靠性：不丢失不损坏不被篡改

XSS（Cross Site Scripting 跨站脚本攻击）
* 执行了非本站的脚本
* 获取页面数据（用户资料）
* 获取Cookies（登录态）
* 劫持前端逻辑（欺骗用户）
* 发送请求
* ...

危害性：
* URL 传播，反射型 XSS
* 社交平台如果有存储型 XSS，通过分享可以大批量获取用户登录态
* 通过存储型 XSS 得到后台管理系统权限

XSS攻击分类
* 反射型：URL 参数直接注入
* 存储型：存储到 DB 后读取注入
* 反射型危害相比存储型要小一点

因为反射型，用户多少会觉得路径有点奇怪，但也有办法消除这个顾虑，比如通过短网址，二维码传播等

XSS攻击注入点（永远不要相信用户输入）
* HTML 节点内容
* HTML 属性（用户输入超出属性本身）
* JavaScript 代码（变量提前关闭）
* 富文本（富文本得保留 HTML ）

防御
* 浏览器自带防御
  * X-XSS-Protection 的 header，默认开启
  * 值有 0 关闭，1 开启，1+url（出现攻击时会向url发送通知）
  * 针对反射型 XSS，且参数出现在 HTML 内容或属性
* 内容转义
  * 时机：插入数据库之前或显示时转义
  * 具体转移字符见函数

HTML内容转义
```js
var escapeHtml = function(str) {
  if(!str) return '';
  str = str.replace(/&/g, '&amp;')//只能最前面
  str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');
	return str;
};
```

HTML属性转义
```js
var escapeHtmlProperty = function(str) {
	if(!str) return '';
	str = str.replace(/"/g, '&quto;');
  str = str.replace(/'/g, '&#39;');
  str = str.replace(/ /g, '&#39;'); // 因为属性也是可以不带引号的，当然按照规范编码，都是要带引号的
	return str;
};
```

> 当然这两个函数可以直接合并为一个 escapeHtml 函数，这里仅是为了区分作用

JavaScript 转义，对数据中引号进行转义，这里不能转义成实体
```js
var escapeForJs = function(str) {
    if(!str) return ''
    str = str.replace(/\\/g, '\\\\')
    str = str.replace(/"/g, '\\"')
    str = str.replace(/'/g, '\\'')
    return str
}
```

以上也不是最保险的解决方案，最保险方案且简便的方案，可以直接对数据做一次 JSON.stringify

富文本
* 由于是富文本，因此需要保留 HTML格 式，因此没办法全部转义
* 过滤
  1. 按照黑名单过滤，实现比较简单，但是很难考虑到所有情况，容易留下漏洞
  2. 按照白名单保留部分标签和属性，比较彻底，但实现比较麻烦
* 时机：针对富文本一般在输入的时候过滤，因为过滤比较耗时，而输入是一次性操作，输出是多次操作

黑名单方式：变种太多，处理不过来
```js
var xssFilter = function(html) {
    if(!html) {return ''}
    html = html.replace(/<\s*\/?script\s*>/g, '')
    html = html.replace(/javascript:[^'"]*/g, '')
    html = html.replace(/onerror\s*=\s*['"]?[^'"]*['"]/g, '')
    return html
}
```

白名单方式
* 将字符串解析成 DOM 树（cheerio库）
* 在白名单保留，不在移除
* 转成字符串

白名单示例
```js
var xssFilter = function(html) {
    if(!html) {return ''}
    var cheerio = require('cheerio')
    var $ = cheerio.load(html)
    // 白名单
    var whiteList = {
        'img': ['src'],
        'font': ['color', 'size'],
        'a': ['href']
    }
    $('*').each(function(index, elem) {
        if(!whiteList[elem.name]) {
            $(elem).remove()
            return
        }
        for(var attr in elem.attribs) {
            if(whiteList[elem.name].indexOf(attr) === -1) {
                $(elem).attr(attr, null)
            }
        }
    })
    return $.html()
}
```

已有解决方案：xss库

终极解决方案：CSP
* Content Security Policy 内容安全策略，用于指定哪些内容可执行
* HTTP 头

CSRF 攻击（Cross Site Request Forgy）
* 跨站请求伪造，别称：One Click Attack
* 区别
  * XSS 本网站运行了来自其他网站的脚本
  * CSRF 指其他网站对本网站产生了影响，其他网站对目标网站发起了请求，在用户不知情的情况下完成
* GET 与 POST
  * 如果请求支持 GET，则攻击来的更简单的，可以是标签 href 属性或 src 属性值即可
  * POST 属性需要构建表单提交，攻击成本也只是稍微高一点

CSRF攻击原理
1. 用户登录A网站
2. A网站确认身份
2. B网站通过表单、链接、图片等访问A网站后端（带A网站身份）

CSRF攻击危害
* 用户用户登录态（盗取用户资金）
* 用户不知情（冒充用户）
* 完成业务请求
* ...

CSRF防御
* 通过原理可以发现特征
  * 会带上 A 网站 Cookie
  * 不访问 A 网站前端
  * HTTP 头中 referer 会 为B 网站
* 禁止第三方网站带 Cookies
  * same-site 属性，限制为同域名
  * 缺点：兼容性不怎么样啊
* 在前端页面加入验证信息
  * 验证码（ccap 库），用户体验有伤害
  * token，本质随机字符串
    1. 放表单中
    2. 放Cookie中
    3. 那 Cookie 中 token 和表单 token 做校验
  * token 是需要放表单的，那么如果是 ajax 请求呢，可以在页面添加 meta 值，手动通过 JS 读取
  * token 存在的问题，如果打开多个页面，因为 cookies 中 token 会刷新，而页面中 token 是保存不变的，因此只有最后一个会生效
* 验证 referer（referrer技术错误）
  * 禁止来自第三方网站的请求
  * 正则验证 referer

Cookies特性
* 前端数据存储
* 后端通过 http 头设置
* 请求时通过 http 头传给后端
* 前端可读写
* 遵守同源策略

Cookies属性
* 域名 domain
* 有效期 expires：Session 值表示仅会话有效，删除 cookie 也是通过有效期实现的
* 路径path：层级作用域
* httpOnly
* secure（仅https）
* sameSite

Cookies作用
* 存储个性化设置（皮肤，上次页面，菜单打开情况）
* 存储未登录时用户唯一标识
* 存储已登录用户的凭证
* 存储其他业务数据

登录用户凭证流程
* 前端提交用户名密码
* 后端验证用户名和密码
* 后端通过 http 头设置用户凭证
* 后续访问后端先验证用户凭证

用户凭证
* 用户 ID
  * 如果用户 ID 比较简单，容易伪造
  * 加固：用户 ID + 签名
  * 加固后如何对应用户呢
    * 签名和用户的存储在 redis 中，需要消耗服务端性能
    * 签名和用户ID同时下发 Cookie，后续请求去 ID 进行同样的签名，然后校验两个签名
* SessionId
  * 用户数据放内存中，建立对应关系
  * 生产环境不能放内存，因为内存有限的，而且重启会丢失，一般会选择放外部存储机做 session 持久化方案
* Token

Cookies 和 XSS 关系
* XSS 可能偷去 Cookies
* httpOnly 的 Cookie 不会被偷

Cookies 和 CSRF关系
* CSRF 利用了用户 Cookies
* 站点攻击无法读写 Cookies
* 最好能阻止第三方使用 Cookies

Cookies 安全策略
* 签名防篡改
* 私有变化（加密）
* httpOnly
* secure
* sameSite

点击劫持
* 通过用户的点击完成了一个操作，但是用户并不知情
* 原理：通过 iframe 访问目标网站，但是对于用户而言不可见，通过按钮等元素的重叠效果，触发指定操作
* 危害：盗取用户资金，获取用户敏感信息等

点击劫持防御
* 攻击前提：被内嵌到iframe中
* JavaScript禁止内嵌（top对象）
```js
if(top.location !== window.location) {
    top.loction = window.location
}
```
* 如果攻击者禁用JS功能呢（iframe 的 sandbox 属性）
* X-FRAME-OPTIONS 头禁止内嵌，兼容性很好，推荐解决点击劫持方案
  * DENY
  * SAME-ORIGIN
  * ALLOW-FROM + url
