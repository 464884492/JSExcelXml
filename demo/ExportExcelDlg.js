<<<<<<< HEAD
﻿/// <reference path="jquery-vs-doc.js" />
=======
/// <reference path="jquery-vs-doc.js" />
>>>>>>> origin/master
// Simple Set Clipboard System
// Author: Joseph Huckaby

var UFSeeyonFileSave = {
    version: "1.0.0-UFSeeyonFileSave",
    clients: {}, // registered upload clients on page, indexed by id
    moviePath: '', // URL to movie
    nextId: 1, // ID of next movie

    $: function (thingy) {
        // simple DOM lookup utility function
        if (typeof (thingy) == 'string') thingy = document.getElementById(thingy);
        if (!thingy.addClass) {
            // extend element with a few useful methods
            thingy.hide = function () { this.style.display = 'none'; };
            thingy.show = function () { this.style.display = ''; };
            thingy.addClass = function (name) { this.removeClass(name); this.className += ' ' + name; };
            thingy.removeClass = function (name) {
                this.className = this.className.replace(new RegExp("\\s*" + name + "\\s*"), " ").replace(/^\s+/, '').replace(/\s+$/, '');
            };
            thingy.hasClass = function (name) {
                return !!this.className.match(new RegExp("\\s*" + name + "\\s*"));
            }
        }
        return thingy;
    },

    setMoviePath: function (path) {
        // set path to UFSeeyonFileSave.swf
        this.moviePath = path;
    },

    dispatch: function (id, eventName, args) {
        // receive event from flash movie, send to client		
        var client = this.clients[id];
        if (client) {
            client.receiveEvent(eventName, args);
        }
    },

    register: function (id, client) {
        // register new client to receive events
        this.clients[id] = client;
    },

    getDOMObjectPosition: function (obj) {
        // get absolute coordinates for dom element
        var info = {
            left: obj.left ? obj.left : obj.offsetLeft,
            top: obj.top ? obj.top : obj.offsetTop,
            width: obj.width ? obj.width : obj.offsetWidth,
            height: obj.height ? obj.height : obj.offsetHeight
        };

        if (obj.style.width != "")
            info.width = obj.style.width.replace("px", "");

        if (obj.style.height != "")
            info.height = obj.style.height.replace("px", "");
        return info;
    },

    Client: function (elem) {
        // constructor for new simple upload client
        this.handlers = {};

        // unique ID
        this.id = UFSeeyonFileSave.nextId++;
        this.movieId = 'ZeroClipboard_TableToolsMovie_' + this.id;

        // register client with singleton to receive flash events
        UFSeeyonFileSave.register(this.id, this);

        // create movie
        if (elem) this.glue(elem);
    }
};

UFSeeyonFileSave.Client.prototype = {

    id: 0, // unique ID for us
    ready: false, // whether movie is ready to receive events or not
    movie: null, // reference to movie object
    clipText: '', // text to copy to clipboard
    fileName: '', // default file save name
    action: 'copy', // action to perform
    handCursorEnabled: true, // whether to show hand cursor, or default pointer cursor
    cssEffects: true, // enable CSS mouse effects on dom container
    handlers: null, // user event handlers
    sized: false,

    glue: function (elem, title) {
        // glue to DOM element
        // elem can be ID or actual DOM element object
        this.domElement = UFSeeyonFileSave.$(elem);

        // float just above object, or zIndex 99 if dom element isn't set
        var zIndex = 99;
        if (this.domElement.style.zIndex) {
            zIndex = parseInt(this.domElement.style.zIndex) + 1;
        }

        // find X/Y position of domElement
        var box = UFSeeyonFileSave.getDOMObjectPosition(this.domElement);

        // create floating DIV above element
        this.div = document.createElement('div');
        var style = this.div.style;
        style.position = 'absolute';
        style.left = (box.left) + 'px';
        style.top = (box.top) + 'px';
        style.width = (box.width) + 'px';
        style.height = box.height + 'px';
        style.zIndex = zIndex;

        if (typeof title != "undefined" && title != "") {
            this.div.title = title;
        }
        if (box.width != 0 && box.height != 0) {
            this.sized = true;
        }

        // style.backgroundColor = '#f00'; // debug
        if (this.domElement) {
            this.domElement.appendChild(this.div);
            this.div.innerHTML = this.getHTML(box.width, box.height);
        }
    },

    positionElement: function () {
        var box = UFSeeyonFileSave.getDOMObjectPosition(this.domElement);
        var style = this.div.style;

        style.position = 'absolute';
        //style.left = (this.domElement.offsetLeft)+'px';
        //style.top = this.domElement.offsetTop+'px';
        style.width = box.width + 'px';
        style.height = box.height + 'px';

        if (box.width != 0 && box.height != 0) {
            this.sized = true;
        } else {
            return;
        }

        var flash = this.div.childNodes[0];
        flash.width = box.width;
        flash.height = box.height;
    },

    getHTML: function (width, height) {
        // return HTML for movie
        var html = '';
        var flashvars = 'id=' + this.id +
			'&width=' + width +
			'&height=' + height;

        if (navigator.userAgent.match(/MSIE/)) {
            // IE gets an OBJECT tag
            var protocol = location.href.match(/^https/i) ? 'https://' : 'http://';
            html += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="' + protocol + 'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="' + width + '" height="' + height + '" id="' + this.movieId + '" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="' + UFSeeyonFileSave.moviePath + '" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="' + flashvars + '"/><param name="wmode" value="transparent"/></object>';
        }
        else {
            // all other browsers get an EMBED tag
            html += '<embed id="' + this.movieId + '" src="' + UFSeeyonFileSave.moviePath + '" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="' + width + '" height="' + height + '" name="' + this.movieId + '" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="' + flashvars + '" wmode="transparent" />';
        }
        return html;
    },

    hide: function () {
        // temporarily hide floater offscreen
        if (this.div) {
            this.div.style.left = '-2000px';
        }
    },

    show: function () {
        // show ourselves after a call to hide()
        this.reposition();
    },

    destroy: function () {
        // destroy control and floater
        if (this.domElement && this.div) {
            this.hide();
            this.div.innerHTML = '';

            var body = document.getElementsByTagName('body')[0];
            try { body.removeChild(this.div); } catch (e) {; }

            this.domElement = null;
            this.div = null;
        }
    },

    reposition: function (elem) {
        // reposition our floating div, optionally to new container
        // warning: container CANNOT change size, only position
        if (elem) {
            this.domElement = UFSeeyonFileSave.$(elem);
            if (!this.domElement) this.hide();
        }

        if (this.domElement && this.div) {
            var box = UFSeeyonFileSave.getDOMObjectPosition(this.domElement);
            var style = this.div.style;
            style.left = '' + box.left + 'px';
            style.top = '' + box.top + 'px';
        }
    },

    clearText: function () {
        // clear the text to be copy / saved
        this.clipText = '';
        if (this.ready) this.movie.clearText();
    },

    appendText: function (newText) {
        // append text to that which is to be copied / saved
        this.clipText += newText;
        if (this.ready) { this.movie.appendText(newText); }
    },

    setText: function (newText) {
        // set text to be copied to be copied / saved
        this.clipText = newText;
        if (this.ready) { this.movie.setText(newText); }
    },

    setCharSet: function (charSet) {
        // set the character set (UTF16LE or UTF8)
        this.charSet = charSet;
        if (this.ready) { this.movie.setCharSet(charSet); }
    },

    setBomInc: function (bomInc) {
        // set if the BOM should be included or not
        this.incBom = bomInc;
        if (this.ready) { this.movie.setBomInc(bomInc); }
    },

    setFileName: function (newText) {
        // set the file name
        this.fileName = newText;
        if (this.ready) this.movie.setFileName(newText);
    },

    setAction: function (newText) {
        // set action (save or copy)
        this.action = newText;
        if (this.ready) this.movie.setAction(newText);
    },

    addEventListener: function (eventName, func) {
        // add user event listener for event
        // event types: load, queueStart, fileStart, fileComplete, queueComplete, progress, error, cancel
        eventName = eventName.toString().toLowerCase().replace(/^on/, '');
        if (!this.handlers[eventName]) this.handlers[eventName] = [];
        this.handlers[eventName].push(func);
    },

    setHandCursor: function (enabled) {
        // enable hand cursor (true), or default arrow cursor (false)
        this.handCursorEnabled = enabled;
        if (this.ready) this.movie.setHandCursor(enabled);
    },

    setCSSEffects: function (enabled) {
        // enable or disable CSS effects on DOM container
        this.cssEffects = !!enabled;
    },

    receiveEvent: function (eventName, args) {
        // receive event from flash
        eventName = eventName.toString().toLowerCase().replace(/^on/, '');
        // special behavior for certain events
        switch (eventName) {
            case 'load':
                // movie claims it is ready, but in IE this isn't always the case...
                // bug fix: Cannot extend EMBED DOM elements in Firefox, must use traditional function
                this.movie = document.getElementById(this.movieId);
                if (!this.movie) {
                    var self = this;
                    setTimeout(function () { self.receiveEvent('load', null); }, 1);
                    return;
                }

                // firefox on pc needs a "kick" in order to set these in certain cases
                if (!this.ready && navigator.userAgent.match(/Firefox/) && navigator.userAgent.match(/Windows/)) {
                    var self = this;
                    setTimeout(function () { self.receiveEvent('load', null); }, 100);
                    this.ready = true;
                    return;
                }

                this.ready = true;
                this.movie.clearText();
                this.movie.appendText(this.clipText);
                this.movie.setFileName(this.fileName);
                this.movie.setAction(this.action);
                this.movie.setCharSet(this.charSet);
                this.movie.setBomInc(this.incBom);
                this.movie.setHandCursor(this.handCursorEnabled);
                break;

            case 'mouseover':
                if (this.domElement && this.cssEffects) {
                    //this.domElement.addClass('hover');
                    if (this.recoverActive) this.domElement.addClass('active');
                }
                break;

            case 'mouseout':
                if (this.domElement && this.cssEffects) {
                    this.recoverActive = false;
                    if (this.domElement.hasClass('active')) {
                        this.domElement.removeClass('active');
                        this.recoverActive = true;
                    }
                    //this.domElement.removeClass('hover');
                }
                break;

            case 'mousedown':
                if (this.domElement && this.cssEffects) {
                    this.domElement.addClass('active');
                }
                break;
            case 'mouseup':
                if (this.domElement && this.cssEffects) {
                    this.domElement.removeClass('active');
                    this.recoverActive = false;
                    //调用点击事件
                }
                break;
        } // switch eventName

        if (this.handlers[eventName]) {
            for (var idx = 0, len = this.handlers[eventName].length; idx < len; idx++) {
                var func = this.handlers[eventName][idx];

                if (typeof (func) == 'function') {
                    // actual function reference
                    func(this, args);
                }
                else if ((typeof (func) == 'object') && (func.length == 2)) {
                    // PHP style object + method, i.e. [myObject, 'myMethod']
                    func[0][func[1]](this, args);
                }
                else if (typeof (func) == 'string') {
                    // name of function
                    window[func](this, args);
                }
            } // foreach event handler defined
        } // user defined handler for event
    }
};


/***根据传入数据生成
[
               { field: 'F_UserID', title: '公告ID', hidden: true, rowspan: 3,formatter:function(value,x,x), datatype: 'Number' },
               { field: 'F_RealName', title: '姓名', rowspan: 3 bgcolor:"#FF0000"},
               { field: 'F_LoginName', title: '登录名',rowspan: 3 },
               { field: 'F_Password', title: '密码', rowspan: 3， datatype: 'Number'},
               { title: '多表头', colspan: 5 }
            ], [
               { field: 'F_UserNick', title: '昵称',rowspan:2},
               { field: 'F_IdNumber', title: '身份证号', rowspan:2 },
               { title: '多表3', colspan: 3}
            ], [
               { field: 'F_Tel', title: '电话'},
               { field: 'F_BirthDate', title: '生日' },
               { field: 'F_EMail', title: '邮箱' },
            ]
@param {Array} dataOpts.HeadInfo
         [{
         F_userName:xx,F_userPwd:ddd
         },{
         F_userName:11,F_userPwd:222
         }]
@param {Array} dataOpts.RowInfo
@param {Array} dataOpts.FooterInfo
@param {int} dataOpts.RowStart
@param {int} dataOpts.ColumStart
@param {String} dataOpts.SheetName
@param {object} dataOpts.MainTitle{Displayname:'MainTitle',Alignment:'Center'}
@param {object} dataOpts.SecondTitle{Displayname:'SecondTitle',Alignment:'Right'}
@param {object} dataOpts.mergeCells [{field:'F_UserName',index:2,rowspan:2,colspan:2},{field:'F_UserPwd',rowIndex:2,rowspan:2,colspan:2}]
***/
var JSXmlExcel = {
    ConvertXmlDoc: function (text) {
        var xmlDoc = null;
        try {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(text);
        } catch (e) {
            try {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(text, 'text/xml');
            }
            catch (e) {
                alert("无法创建Xml对象");
            }
        }
        return xmlDoc;
    },
    BulidXml: function (dataOpts) {
        var headerXml = "";
        var titleXml = "";
        var rowxml = "";
        var footxml = "";
        var Styles = [];

        //用于记录列信息 字段Field 数据类型
        var columnInfo = new Array();
        var skipRowIndex = 0;
        var ExpandedColumnCount = dataOpts.ColumStart - 1;
        var ExpandedRowCount = dataOpts.RowStart - 1;
        if (dataOpts.MainTitle.Displayname) { skipRowIndex = skipRowIndex + 1; ExpandedRowCount = ExpandedRowCount + 1 };
        if (dataOpts.SecondTitle.Displayname) { skipRowIndex = skipRowIndex + 1; ExpandedRowCount = ExpandedRowCount + 1 };
        //表头信息
        var objhead = this.BuildHeadXml(dataOpts.HeadInfo, dataOpts.RowStart, dataOpts.ColumStart, skipRowIndex, Styles, dataOpts.DataStyle);
        headerXml = objhead.headerXml;
        ExpandedRowCount = objhead.rowcount + ExpandedRowCount;
        ExpandedColumnCount = objhead.columnCount + ExpandedColumnCount;
        columnInfo = objhead.columnInfo;
        //创建表标题
        if (dataOpts.MainTitle.Displayname) {
            //构建主标题样式
            Styles.push(this.BuildStyleFactory('MTitleDataStyle', dataOpts.MainTitle));
            titleXml += this.BuildTitleXml(dataOpts.RowStart, dataOpts.ColumStart, ExpandedColumnCount, dataOpts.MainTitle.Displayname, 'MTitleDataStyle');
        }
        var STitleDataStyle = '';
        if (dataOpts.SecondTitle.Displayname) {
            //dataOpts.RowStart + skipRowIndex - 1 处理只有副标题 行index混乱问题
            //构建副标题样式
            Styles.push(this.BuildStyleFactory('STitleDataStyle', dataOpts.SecondTitle));
            titleXml += this.BuildTitleXml((dataOpts.RowStart + skipRowIndex - 1), dataOpts.ColumStart, ExpandedColumnCount, dataOpts.SecondTitle.Displayname, 'STitleDataStyle');
        }
        //基本样式
        Styles.push(this.BuildStyleFactory('TableDataStyle', dataOpts.DataStyle));
        Styles.push(this.BuildStyleFactory('TableHeadStyle', dataOpts.HeadStyle));
        //创建数据
        var dataobj = this.BuildDataXml(dataOpts.RowInfo, columnInfo, dataOpts.ColumStart, dataOpts.MergeCells, dataOpts.CellStyles, Styles, dataOpts.DataStyle);
        ExpandedRowCount = ExpandedRowCount + dataobj.rowCount;
        rowxml = dataobj.rowxml;
        //创建Footer
        if (dataOpts.FooterInfo) {
            Styles.push(this.BuildStyleFactory("TableFootStyle", dataOpts.FootStyle));
            var FootObj = this.BuildFooterXml(dataOpts.FooterInfo, columnInfo, dataOpts.ColumStart, "TableFootStyle");
            footxml = FootObj.footXml;
            ExpandedRowCount = ExpandedRowCount + FootObj.rowCount;
        }
        //WorkSheet
        var WorkSheet = '<Worksheet ss:Name="' + dataOpts.SheetName + '">' +
      '<Table ss:ExpandedColumnCount="' + ExpandedColumnCount +
      '" ss:ExpandedRowCount="' + ExpandedRowCount +
      '" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="16">' + titleXml + headerXml + rowxml + footxml +
        '</Table></Worksheet>';
        return this.BuildAllXml(Styles.join(' '), WorkSheet);
    },
    //构建样式
    BuildBorderStyle: function () {
        //ss: Color = "' + colors + '"
        var borders = ' <Borders> ' +
                            '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" /> ' +
                            '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/> ' +
                            '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" /> ' +
                            '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" /> ' +
                            '</Borders> ';
        return borders;
    },
    BuildBackGound: function (colors) {
        return '<Interior ss:Color="' + colors + '" ss:Pattern="Solid"/>'
    },
    BuildFontStyle: function (fontSize, fontcolor, isBold, isItalic, isUnderline) {
        var fonts = ['<Font ss:FontName="宋体" x:CharSet="134" ss:Size="' + fontSize + '"  ss:Color="' + fontcolor + '" '];
        if (isBold) { fonts.push(' ss:Bold="1" '); }
        if (isItalic) { fonts.push(' ss:Italic="1" '); }
        if (isUnderline) { fonts.push(' ss:Underline="Single" ') }
        fonts.push('/>')
        return fonts.join('');
    },
    BuildAlignment: function (alignment) {
        var isWarp = arguments[1] ? arguments[1] : 1;
        var al = '<Alignment ss:Horizontal="' + alignment + '" ss:Vertical="Center" ss:WrapText="' + isWarp + '"/>';
        return al;
    },
    BuildStyleFactory: function (styleid, cfgData) {
        var styles = ['<Style ss:ID="' + styleid + '"> '];
        var alg = this.BuildAlignment(cfgData.Alignment);
        var font = this.BuildFontStyle(cfgData.FontSize, cfgData.FontColor, cfgData.IsBold, cfgData.IsItalic, cfgData.IsUnderLine);
        var border = this.BuildBorderStyle();
        var bg = this.BuildBackGound(cfgData.BgColor);
        styles = styles.concat([alg, font, border, bg, '</Style>']);
        return styles.join('');
    },
    //构建数据XML
    BuildTitleXml: function (rowStart, colStart, allColumn, displayText, styleID) {
        var titleXml = '';
        var Height = 26;
        if (styleID === "MTitleDataStyle") {
            Height = 40;
        }
        titleXml += '<Row ss:Index="' + rowStart + '" ss:AutoFitHeight="0" ss:Height="' + Height + '">';
        titleXml += '<Cell ss:Index="' + colStart
            + '" ss:MergeAcross="' + (allColumn - colStart)
            + '" ss:StyleID="' + styleID + '"><Data ss:Type="String">' + displayText
            + '</Data></Cell></Row>';
        return titleXml;
    },
    BuildHeadXml: function (headInfo, rowStart, columnStart, skipRowIndex, Styles, defaultseting) {
        var columnInfo = new Array();
        var headerXml = '';
        var columnCount = 0;
        var rowcount = 0;
        var cellStartindex = columnStart;
        var currentIndex = columnStart;
        for (var i = 0; i < headInfo.length; i++) {
            var rowindex = rowStart + i + skipRowIndex;
            headerXml += '<Row ss:Index="' + rowindex + '" ss:AutoFitHeight="0">';
            var find = false;
            var setindex = true;
            for (var cell = 0; cell < headInfo[i].length; cell++) {
                var curcell = headInfo[i][cell];
                if (curcell.hidden || curcell.checkbox)
                    continue;
                var MergeDown = curcell.rowspan ? curcell.rowspan - 1 : 0;
                var MergeAcross = curcell.colspan ? curcell.colspan - 1 : 0;
                if (curcell.field) {
                    columnCount = columnCount + 1;
                    currentIndex = currentIndex + 1;
                    //判断是否单独设置列背景色
                    var cobj = { columnfield: curcell.field, columnType: curcell.datatype, formatter: curcell.formatter };
                    if (curcell.bgcolor) {
                        cobj.BgColor = curcell.bgcolor;
                        var cellstyle = this.BuildStyleFactory("col_" + curcell.field, $.extend(true, {}, defaultseting, { BgColor: cobj.BgColor }));
                        Styles.push(cellstyle);
                    }
                    columnInfo.push(cobj);
                }
                if (MergeAcross != 0 && !find) {
                    find = true;
                    cellStartindex = currentIndex;
                }
                headerXml += '<Cell ss:StyleID="TableHeadStyle" ' +
                    (setindex === true ? 'ss:Index="' + cellStartindex + '"' : '') +
                    ' ss:MergeDown="' + MergeDown + '"' +
                ' ss:MergeAcross="' + MergeAcross + '"' +
                ' ><Data ss:Type="String">' + curcell.title + '</Data></Cell>';
                setindex = false;
            }
            headerXml += '</Row>';
            rowcount = rowcount + 1;
        }
        return {
            columnInfo: columnInfo,
            columnCount: columnCount,
            rowcount: rowcount,
            headerXml: headerXml
        }
    },
    BuildDataXml: function (rowInfo, columnInfo, columStart, mergeCells, CellStyles, Styles, defaultsetting) {
        var rowCount = 0;
        var rowxml = '';
        for (var i = 0; i < rowInfo.length; i++) {
            var Style = "TableDataStyle";
            rowxml += '<Row ss:AutoFitHeight="0">';
            if (rowInfo[i].BgColor) {
                var cfg = $.extend(true, {}, defaultsetting, { BgColor: rowInfo[i].BgColor });
                Styles.push(this.BuildStyleFactory("row_" + i, cfg));
                Style = "row_" + i;
            }
            var resetStyle = Style;
            for (var j = 0; j < columnInfo.length; j++) {
                var col = columnInfo[j];
                var value = rowInfo[i][col.columnfield];
                if (col.formatter) {
                    value = col.formatter(value, null, null);
                }
                if (value != 0) {
                    value = value || ' ';
                }
                var type = columnInfo[j].columnType ? columnInfo[j].columnType : "String";
                var cellindex = columStart + j;
                if (col.BgColor) {
                    Style = "col_" + col.columnfield;
                }
                rowxml += '<Cell field="' + col.columnfield + '" ss:StyleID="' + Style + '" ss:Index="' + cellindex + '" ><Data ss:Type="' + type + '">' + value + '</Data></Cell>';
                Style = resetStyle;
            }
            rowxml += '</Row> ';
            rowCount = rowCount + 1;
        };
        //处理合并数据
        if (mergeCells) {
            var $xml = $(this.ConvertXmlDoc('<?xml version="1.0" encoding="utf-8" ?>\
                <rows xmlns="urn:schemas-microsoft-com:office:spreadsheet"\
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' + rowxml + '</rows>'));
            for (var i = 0; i < mergeCells.length; i++) {
                var mginfo = mergeCells[i];
                $xml.find("Row").each(function (index, row) {
                    if (index == mginfo.index) {
                        //找到行
                        var cell = $(row).find("Cell[field=" + mginfo.field + "]").first();
                        //列合并
                        if (mginfo.colspan) {
                            var ma = mginfo.colspan - 1;
                            cell.attr({
                                "ss:MergeAcross": ma
                            });
                            //删除后边的同伴
                            cell.nextAll(":lt(" + ma + ")").remove();
                        }
                        // 行合并
                        if (mginfo.rowspan) {
                            var md = mginfo.rowspan - 1;
                            cell.attr({
                                "ss:MergeDown": md
                            });
                            //删除下一行中对应的列
                            $(row).nextAll(":lt(" + md + ")").each(function (index, currow) {
                                var curcell = $(currow).find("Cell[field=" + mginfo.field + "]").first();
                                //存在列合并
                                if (mginfo.colspan) {
                                    curcell.nextAll(":lt(" + (mginfo.colspan - 1) + ")").remove();
                                }
                                curcell.remove();
                            });
                        }
                    }
                });
            }
            if (!window.ActiveXObject) {
                //非IE
                rowxml = $xml[0].getElementsByTagName("rows")[0].innerHTML;
                rowxml = rowxml.replace(/xmlns="urn:schemas-microsoft-com:office:spreadsheet"|xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"/gi, '');
            }
            else {
                //IE
                var rows = $("Row", $xml[0]);
                rowxml = "";
                rows.each(function (index, row) {
                    rowxml = rowxml + row.xml.replace(/xmlns="urn:schemas-microsoft-com:office:spreadsheet"|xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"/gi, '');
                });
            }
        }
        //处理指定单元格样式
        if (CellStyles) {
            //todo
            var $xml = $(this.ConvertXmlDoc('<?xml version="1.0" encoding="utf-8" ?>\
                <rows xmlns="urn:schemas-microsoft-com:office:spreadsheet"\
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' + rowxml + '</rows>'));
            for (var i = 0; i < CellStyles.length; i++) {
                var cellinfo = CellStyles[i];
                var cthis = this;
                $xml.find("Row").each(function (index, row) {
                    if (index == cellinfo.index) { //找到行
                        //找列
                        var cell = $(row).find("Cell[field=" + cellinfo.field + "]").first();
                        var styleid = "Cell_" + index + "_" + cellinfo.field;
                        cell.attr("ss:StyleID", styleid);
                        //生成样式
                        var cfg = $.extend(true, {}, defaultsetting, { BgColor: cellinfo.BgColor });
                        Styles.push(cthis.BuildStyleFactory(styleid, cfg));
                    }
                });
            }
            if (!window.ActiveXObject) {
                rowxml = $xml[0].getElementsByTagName("rows")[0].innerHTML;
                rowxml = rowxml.replace(/xmlns="urn:schemas-microsoft-com:office:spreadsheet"|xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"/gi, '');
            } else {
                var rows = $("Row", $xml[0]);
                rowxml = "";
                rows.each(function (index, row) {
                    rowxml = rowxml + row.xml.replace(/xmlns="urn:schemas-microsoft-com:office:spreadsheet"|xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"/g, '');
                });
            };
        }
        return { rowCount: rowCount, rowxml: rowxml };
    },
    BuildFooterXml: function (footInfo, columnInfo, columnStart, styleFootID) {
        var footXml;
        var rowCount = 0;
        for (var i = 0; i < footInfo.length; i++) {
            footXml += '<Row ss:AutoFitHeight="0">';
            for (var j = 0; j < columnInfo.length; j++) {
                var value = footInfo[i][columnInfo[j].columnfield];
                var type = columnInfo[j].columnType ? columnInfo[j].columnType : "String";
                footXml += '<Cell ss:StyleID="' + styleFootID + '" ' + (j === 0 ? 'ss:Index="' + columnStart + '"' : ' ') +
                    ' ><Data ss:Type="' + type + '">' + (value ? value : "") + '</Data></Cell>';
            }
            footXml += '</Row> ';
            rowCount = rowCount + 1;
        }
        return { footXml: footXml, rowCount: rowCount };
    },
    BuildAllXml: function (styles, workSheet) {
        var xmlInfo = '<?xml version="1.0" encoding="utf-8"?>  ' +
                          '<?mso-application progid="Excel.Sheet"?>  ' +
                          '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"  ' +
                          'xmlns:o="urn:schemas-microsoft-com:office:office"  ' +
                          'xmlns:x="urn:schemas-microsoft-com:office:excel"  ' +
                          'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"  ' +
                          'xmlns:html="http://www.w3.org/TR/REC-html40">  ' +
                          '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">  ' +
                          '</DocumentProperties>  ' +
                          '<OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office">  ' +
                          '<RemovePersonalInformation/>  ' +
                          '</OfficeDocumentSettings>  ' +
                          '<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">  ' +
                          '</ExcelWorkbook><Styles>  ' + styles + '</Styles>  ' +
                           workSheet + ' </Workbook>';
        return xmlInfo;
    },
    //构建数据模板
    // json{colnum:2,Start:0,end:10,datasource:['xx','xx']}
    BuildDataValidation: function (colnum, start, end) {
        var dvxml = '  <DataValidation xmlns="urn:schemas-microsoft-com:office:excel">\
                                 <Range>C' + colnum + '</Range>\
                                 <Type>List</Type>\
                                 <Value>INDIRECT(&quot;enum!a' + start + ':a' + end + '&quot;)</Value>\
                              </DataValidation>';
        return dvxml;
    },
    BuildTmpleteXml: function (dataOpts) {
        var field = ' <Row ss:AutoFitHeight="0" ss:Hidden="1">';
        var display = '<Row ss:AutoFitHeight="0"  ss:Height="30">';
        var dv = ''; //数据有效性
        var ds = []; //数据有效性数据源
        var dsnum = 1;
        var cols = dataOpts.HeadInfo;
        for (var i = 0; i < cols.length; i++) {
            var col = cols[i];
            field = field + '<Cell ss:StyleID="hdbg"><Data ss:Type="String">' + col.field + '</Data></Cell>';
            display = display + '<Cell ss:StyleID="hdbg"><Data ss:Type="String">' + col.title + '</Data></Cell>';
            if (col.datasource) {
                var obj = {
                    colnum: i + 1,
                    start: dsnum,
                    end: dsnum + col.datasource.length - 1,
                    datasource: col.datasource
                };
                dv = dv + this.BuildDataValidation(obj.colnum, obj.start, obj.end);
                ds.push(obj);
                dsnum = obj.end + 1;
            }
        }
        field = field + '</Row>';
        display = display + '</Row>';
        var sheet = '<Worksheet ss:Name="' + dataOpts.SheetName + '">\
                            <Table ss:ExpandedColumnCount="' + cols.length + '" ss:ExpandedRowCount="2" x:FullColumns="1"\
                             x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="13.5" ss:StyleID="tbbg">\
                            <Column ss:StyleID="bdbg" ss:Span="' + (cols.length - 1) + '"/>\
                            ' + field + display + '</Table>\
                            ' + dv + '</Worksheet>';
        var dsSheet = this.BuildEnumSheet(ds);
        var tbgstyle = ['<Style ss:ID="tbbg">', this.BuildBackGound('#FFFFFF'), '</Style>'].join('');
        var hdstyle = ['<Style ss:ID="hdbg">', this.BuildBorderStyle(), this.BuildBackGound('#D8D8D8'), '</Style>'].join('');
        var border = ['<Style ss:ID="bdbg">', this.BuildBorderStyle(), '</Style>'].join('');
        var xml = this.BuildAllXml([tbgstyle, hdstyle, border].join(''), [sheet, dsSheet].join(''));
        return xml;
    },
    BuildEnumSheet: function (dataList) {
        var rownumber = 1;
        var rows = '';
        for (var i = 0; i < dataList.length; i++) {
            var obj = dataList[i];
            obj.startRow = rownumber;
            for (var j = 0; j < obj.datasource.length; j++) {
                rows = rows + ' <Row ss:AutoFitHeight="0"><Cell><Data ss:Type="String">' + obj.datasource[j] + '</Data></Cell></Row>';
                rownumber++;
            }
            obj.endRow = rownumber;
        }
        var sheet = '<Worksheet ss:Name="enum">\
       <Table ss:ExpandedColumnCount="1" ss:ExpandedRowCount="'+ rownumber + '" x:FullColumns="1"\
        x:FullRows="1" ss:DefaultColumnWidth="54" ss:DefaultRowHeight="13.5">\
        ' + rows + '</Table>\
       <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\
        <Visible>SheetHidden</Visible>\
       </WorksheetOptions>\
      </Worksheet>';
        return sheet;
    }
};
; (function ($) {
    $.ExportExcelDlg = function (opts, param) {
        var defaultseeting = {
            HeadInfo: null,
            RowInfo: null,
            FooterInfo: null,
            MergeCells: null,
            CellStyles: null,
            MainTitle: { Displayname: '', Alignment: 'Center', BgColor: '#FFFFFF', FontSize: 16, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false },
            SecondTitle: { Displayname: '', Alignment: 'Left', BgColor: '#FFFFFF', FontSize: 14, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false },
            HeadStyle: { Alignment: 'Center', BgColor: '#D8D8D8', FontSize: 12, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false },
            DataStyle: { Alignment: 'Center', BgColor: '#FFFFFF', FontSize: 10, FontColor: "#000000", IsBold: false, IsItalic: false, IsUnderLine: false },
            FootStyle: { Alignment: 'Center', BgColor: '#D8D8D8', FontSize: 12, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false },
            RowStart: 1,
            ColumStart: 1,
            SheetName: 'sheet1',
            SaveName: "导出数据",
            Swf: 'ExportExcel.swf'
        };
        var container = $("#EEDlg");
        var flash = null;
        if (container.length == 0) {
            container = $('<div id="EEDlg"/>');
            container.dialog({
                title: '文件导出',
                width: 300,
                height: 160,
                modal: true,
                closed: true,
                resizable: false,
                buttons: [{
                    text: '确定',
                    id: 'EEDlg_btnconfirm'
                }, {
                    text: '取消',
                    handler: function () {
                        container.dialog('close');
                        flash.clearText();
                        flash.destroy();
                    }
                }],
                onOpen: function () {
                    UFSeeyonFileSave.setMoviePath(opts.Swf);
                    flash = new UFSeeyonFileSave.Client("EEDlg_btnconfirm");
                    flash.setHandCursor(true);
                    flash.setAction('save');
                    flash.setCharSet('UTF8');
                    flash.addEventListener("complete", function () {
                        container.dialog('destroy');
                        flash.clearText();
                        flash.destroy();
                    });
                    defaultseeting = $.extend(true, defaultseeting, opts);
                    var excelxml = JSXmlExcel.BulidXml(defaultseeting);
                    flash.setText(excelxml);
                    excelxml = null;
                    flash.setFileName(opts.SaveName + '.xls');
                }
            });
            container.find(".panel-body").first().append('<div style="margin:15px"><span>您确定导出数据吗？点击确定选择存储位置</span></div>');
        }
        if (typeof opts == 'string') {
            $("#EEDlg").dialog(opts, param);
        };
        return this;
    };
    //dataOpts{sheetName:'xxx',cols:[{field:'F_UserName',title:'用户名',datasource:['xxx','xxx']},{}]}
    $.ExportExcelTmp = function (opts, param) {

        var container = $("#EETDlg");
        var flashT = null;
        if (container.length == 0) {
            container = $('<div id="EETDlg"/>');
            container.dialog({
                title: '模板导出',
                width: 300,
                height: 160,
                modal: true,
                closed: true,
                resizable: false,
                buttons: [{
                    text: '确定',
                    id: 'EETDlg_btnconfirm'
                }, {
                    text: '取消',
                    handler: function () {
                        container.dialog('close');
                    }
                }],
                onOpen: function () {
                    UFSeeyonFileSave.setMoviePath(opts.Swf);
                    flashT = new UFSeeyonFileSave.Client("EETDlg_btnconfirm");
                    flashT.setHandCursor(true);
                    flashT.setAction('save');
                    flashT.setCharSet('UTF8');
                    flashT.addEventListener("complete", function () {
                        container.dialog('close');
                        flashT.clearText();
                        flashT.destroy();
                    });
                    var excelxml = JSXmlExcel.BuildTmpleteXml(opts);
                    flashT.setText(excelxml);
                    excelxml = null;
                    flashT.setFileName(opts.SaveName + '.xls');
                }
            });
            container.find(".panel-body").first().append('<div style="margin:15px"><span>数据填写模板，点击确定选择存储位置</span></div>');
        }
        if (typeof opts == 'string') {
            $("#EETDlg").dialog(opts, param);
        };
        return this;
    };
<<<<<<< HEAD
})(jQuery);
=======
})(jQuery);
>>>>>>> origin/master
