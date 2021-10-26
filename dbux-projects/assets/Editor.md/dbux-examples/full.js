const editormd = require('../src/editormd')();
var testEditor;

$(function () {
  $.get('/examples/test.md', function (md) {
    testEditor = editormd("test-editormd", {
      width: "90%",
      height: 740,
      path: '../lib/',
      theme: "dark",
      previewTheme: "dark",
      editorTheme: "pastel-on-dark",
      markdown: md,
      codeFold: true,
      //syncScrolling : false,
      saveHTMLToTextarea: true,    // 保存 HTML 到 Textarea
      searchReplace: true,
      //watch : false,                // 关闭实时预览
      htmlDecode: "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启    
      //toolbar  : false,             //关闭工具栏
      //previewCodeHighlight : false, // 关闭预览 HTML 的代码块高亮，默认开启
      emoji: true,
      taskList: true,
      tocm: true,         // Using [TOCM]
      tex: true,                   // 开启科学公式TeX语言支持，默认关闭
      flowChart: true,             // 开启流程图支持，默认关闭
      sequenceDiagram: true,       // 开启时序/序列图支持，默认关闭,
      //dialogLockScreen : false,   // 设置弹出层对话框不锁屏，全局通用，默认为true
      //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为true
      //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为true
      //dialogMaskOpacity : 0.4,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
      //dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
      imageUpload: true,
      imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
      imageUploadURL: "./php/upload.php",
      onload: function () {
        console.log('onload', this);
        //this.fullscreen();
        //this.unwatch();
        //this.watch().fullscreen();

        //this.setMarkdown("#PHP");
        //this.width("100%");
        //this.height(480);
        //this.resize("100%", 640);
      }
    });
  });

  $("#goto-line-btn").bind("click", function () {
    testEditor.gotoLine(90);
  });

  $("#show-btn").bind('click', function () {
    testEditor.show();
  });

  $("#hide-btn").bind('click', function () {
    testEditor.hide();
  });

  $("#get-md-btn").bind('click', function () {
    alert(testEditor.getMarkdown());
  });

  $("#get-html-btn").bind('click', function () {
    alert(testEditor.getHTML());
  });

  $("#watch-btn").bind('click', function () {
    testEditor.watch();
  });

  $("#unwatch-btn").bind('click', function () {
    testEditor.unwatch();
  });

  $("#preview-btn").bind('click', function () {
    testEditor.previewing();
  });

  $("#fullscreen-btn").bind('click', function () {
    testEditor.fullscreen();
  });

  $("#show-toolbar-btn").bind('click', function () {
    testEditor.showToolbar();
  });

  $("#close-toolbar-btn").bind('click', function () {
    testEditor.hideToolbar();
  });

  $("#toc-menu-btn").click(function () {
    testEditor.config({
      tocDropdown: true,
      tocTitle: "目录 Table of Contents",
    });
  });

  $("#toc-default-btn").click(function () {
    testEditor.config("tocDropdown", false);
  });
});