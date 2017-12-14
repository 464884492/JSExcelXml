var saveAs = saveAs || (function (view) {
    "use strict";
    // IE <10 is explicitly unsupported
    if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return;
    }
    var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function () {
		    return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function (node) {
		    var event = new MouseEvent("click");
		    node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement)
		, is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function (ex) {
		    (view.setImmediate || view.setTimeout)(function () {
		        throw ex;
		    }, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function (file) {
		    var revoker = function () {
		        if (typeof file === "string") { // file is an object URL
		            get_URL().revokeObjectURL(file);
		        } else { // file is a File
		            file.remove();
		        }
		    };
		    setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function (filesaver, event_types, event) {
		    event_types = [].concat(event_types);
		    var i = event_types.length;
		    while (i--) {
		        var listener = filesaver["on" + event_types[i]];
		        if (typeof listener === "function") {
		            try {
		                listener.call(filesaver, event || filesaver);
		            } catch (ex) {
		                throw_outside(ex);
		            }
		        }
		    }
		}
		, auto_bom = function (blob) {
		    // prepend BOM for UTF-8 XML and text/* types (including HTML)
		    // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
		    if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
		        return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type });
		    }
		    return blob;
		}
		, FileSaver = function (blob, name, no_auto_bom) {
		    if (!no_auto_bom) {
		        blob = auto_bom(blob);
		    }
		    // First try a.download, then web filesystem, then object URLs
		    var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function () {
				    dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function () {
				    if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
				        // Safari doesn't allow downloading of blob urls
				        var reader = new FileReader();
				        reader.onloadend = function () {
				            var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
				            var popup = view.open(url, '_blank');
				            if (!popup) view.location.href = url;
				            url = undefined; // release reference before dispatching
				            filesaver.readyState = filesaver.DONE;
				            dispatch_all();
				        };
				        reader.readAsDataURL(blob);
				        filesaver.readyState = filesaver.INIT;
				        return;
				    }
				    // don't create more object URLs than needed
				    if (!object_url) {
				        object_url = get_URL().createObjectURL(blob);
				    }
				    if (force) {
				        view.location.href = object_url;
				    } else {
				        var opened = view.open(object_url, "_blank");
				        if (!opened) {
				            // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
				            view.location.href = object_url;
				        }
				    }
				    filesaver.readyState = filesaver.DONE;
				    dispatch_all();
				    revoke(object_url);
				}
		    ;
		    filesaver.readyState = filesaver.INIT;

		    if (can_use_save_link) {
		        object_url = get_URL().createObjectURL(blob);
		        setTimeout(function () {
		            save_link.href = object_url;
		            save_link.download = name;
		            click(save_link);
		            setTimeout(function () {
		                dispatch_all();
		                revoke(object_url);
		                filesaver.readyState = filesaver.DONE;
		            });
		        });
		        return;
		    }

		    fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function (blob, name, no_auto_bom) {
		    return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
    ;
    // IE 10+ (native saveAs)
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function (blob, name, no_auto_bom) {
            name = name || blob.name || "download";

            if (!no_auto_bom) {
                blob = auto_bom(blob);
            }
            return navigator.msSaveOrOpenBlob(blob, name);
        };
    }

    FS_proto.abort = function () { };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;

    FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

    return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
    define([], function () {
        return saveAs;
    });
}


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
        var widthxml = '';
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
        //创建列宽度
        widthxml = this.BuildColumnWidthXml(columnInfo);

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
            '" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="16">' + widthxml + titleXml + headerXml + rowxml + footxml +
            '</Table></Worksheet>';
        return this.BuildAllXml(Styles.join(' '), WorkSheet);
    },
    //设置列宽 m默认100px
    BuildColumnWidthXml: function (columnInfo) {
        var widthxml = [];
        for (var columnIndex in columnInfo) {
            widthxml.push('<Column ss:Index="' + (parseInt(columnIndex) + 1) + '" ss:AutoFitWidth="0" ss:Width="' + (columnInfo[columnIndex].excelWidth || 100) + '"/>');
        }
        return widthxml.join("");
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
        (function (columns) {
           var headRowLen = columns.length;
            for (var y = 0; y < headRowLen; y++) {
                var curXRow =columns[y];
                var curXRowLen = curXRow.length;
                var nextPosx = 0;
                for (var x = 0; x < curXRowLen; x++) {
                    var curXCell = curXRow[x];
                    curXCell.pos = {};
                    curXCell.pos.x = nextPosx;
                    curXCell.pos.y = y;
                    curXCell.colspan = curXCell.colspan || 1;
                    nextPosx = nextPosx + curXCell.colspan;
                }
            }
            for (var rowIndex = columns.length - 1; rowIndex >= 0; rowIndex--) {
                var curYRow = columns[rowIndex];
                for (var cellIndex = 0; cellIndex < curYRow.length; cellIndex++) {
                    var curCell = curYRow[cellIndex];
                    curCell.rowspan = curCell.rowspan || 1;
                    if (curCell.rowspan > 1) {
                        for (var nextRowindex = rowIndex + 1; nextRowindex <columns.length && curCell.rowspan > nextRowindex - rowIndex; nextRowindex++) {
                            var nextRow = columns[nextRowindex];
                            for (var nextCellIndex = 0; nextCellIndex < nextRow.length; nextCellIndex++) {
                                var nextCell = nextRow[nextCellIndex];
                                if (nextCell.pos.x >= curCell.pos.x) {
                                    nextCell.pos.x += curCell.colspan;
                                }
                            }
                        }
                    }
                }
            }
        })(headInfo);
        for (var i = 0; i < headInfo.length; i++) {
            var rowindex = rowStart + i + skipRowIndex;
            headerXml += '<Row ss:Index="' + rowindex + '" ss:AutoFitHeight="0">';
            for (var cell = 0; cell < headInfo[i].length; cell++) {
                var curcell = headInfo[i][cell];
                if (curcell.hidden || curcell.checkbox)
                    continue;
                var MergeDown = curcell.rowspan ? curcell.rowspan - 1 : 0;
                var MergeAcross = curcell.colspan ? curcell.colspan - 1 : 0;
                if (curcell.field) {
                    columnCount = columnCount + 1;
                    //判断是否单独设置列背景色
                    var cobj = { columnfield: curcell.field, columnType: curcell.datatype, formatter: curcell.formatter, pos: curcell.pos.x, align: curcell.align };
                    var colStyle = {};
                    if (curcell.bgcolor) {
                        cobj.BgColor = curcell.bgcolor
                        colStyle.BgColor = curcell.bgcolor;
                    }
                    if (curcell.align) {
                        if (curcell.align == "left") { colStyle.Alignment = "Left"; cobj.align = "Left"; }
                        if (curcell.align == "right") { colStyle.Alignment = "Right"; cobj.align = "Right"; }
                        if (curcell.align == "center") { colStyle.Alignment = "Center"; cobj.align = "Center"; }
                    }
                    var cellstyle = this.BuildStyleFactory("col_" + curcell.field, $.extend(true, {}, defaultseting, colStyle));
                    Styles.push(cellstyle);
                    columnInfo.push(cobj);
                }
                headerXml += '<Cell ss:StyleID="TableHeadStyle" ' + 'ss:Index="' + (curcell.pos.x + columnStart) + '"' +
                    ' ss:MergeDown="' + MergeDown + '"' +
                    ' ss:MergeAcross="' + MergeAcross + '"' +
                    ' ><Data ss:Type="String">' + curcell.title + '</Data></Cell>';
            }
            headerXml += '</Row>';
            rowcount = rowcount + 1;
        }
        columnInfo.sort(function (a, b) { return a.pos.x - b.pos.x });
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
            rowxml += '<Row ss:AutoFitHeight="0">';
            var resetStyle = Style;
            for (var j = 0; j < columnInfo.length; j++) {
                var col = columnInfo[j];
                var value = rowInfo[i][col.columnfield];
                if (col.formatter) {
                    value = col.formatter(value, rowInfo[i], i);
                }
                if (value != 0) {
                    value = value || ' ';
                }
                var type = columnInfo[j].columnType ? columnInfo[j].columnType : "String";
                var cellindex = columStart + j;
                var Style = "col_" + col.columnfield;
                if (rowInfo[i].F_BACKGROUND) {
                    var cfg = $.extend(true, {}, defaultsetting, { BgColor: rowInfo[i].F_BACKGROUND, Alignment: col.align });
                    Styles.push(this.BuildStyleFactory("row_" + i + "_" + j, cfg));
                    Style = "row_" + i + "_" + j;
                }
                rowxml += '<Cell field="' + col.columnfield + '" ss:StyleID="' + Style + '" ss:Index="' + cellindex + '" ><Data ss:Type="' + type + '">' + this.EncodeValue(value) + '</Data></Cell>';
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
                            var cells = cell.nextAll(":lt(" + ma + ")");
                            if (!window.ActiveXObject) {
                                //删除后边的同伴
                                cells.remove();
                            } else {
                                cells.each(function (index, cell) {
                                    $(row)[0].removeChild($(this)[0]);
                                });
                            }
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
                                var cells = null;
                                //存在列合并
                                if (mginfo.colspan) {
                                    cells = curcell.nextAll(":lt(" + (mginfo.colspan - 1) + ")");
                                }
                                if (!window.ActiveXObject) {
                                    if (cells) { cells.remove(); }
                                    curcell.remove();
                                } else {
                                    //IE 
                                    if (cells) {
                                        cells.each(function (i, r) { $(currow)[0].removeChild($(this)[0]); });
                                    }
                                    $(currow)[0].removeChild(curcell[0]);
                                }
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
                    ' ><Data ss:Type="' + type + '">' + this.EncodeValue((value ? value : "")) + '</Data></Cell>';
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
        var border = ['<Style ss:ID="bdbg">', this.BuildBorderStyle(), this.BuildAlignment('Left', 1), '</Style>'].join('');
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
    },

    EncodeValue: function (content) {
        var code = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' };
        var encodeC = "";
        encodeC = content.replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;')
            .replace(/&(?![a-zA-Z]{1,10};)/, "&amp;");
        return encodeC;
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
            swf: 'exportexcel.swf'
        };
        var container = $("#EEDlg");
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
                    id: 'EEDlg_btnconfirm',
                    handler: function () {
                        var newOpts = $.extend(true, defaultseeting, opts);
                        var blob = new Blob([JSXmlExcel.BulidXml(newOpts)], { type: "text/xml;charset=utf-8" });
                        var fs = saveAs(blob, newOpts.SaveName + '.xls');
                        fs.onwriteend = function () {
                            setTimeout(function () {
                                container.dialog('close');
                                $("#EEDlg").dialog("destroy");
                                blob = null;
                            }, 100);
                        };

                    },
                }, {
                    text: '取消',
                    handler: function () {
                        container.dialog('close');
                         $("#EEDlg").dialog("destroy");
                    }
                }],
            });
            container.find(".panel-body").append('<div style="margin:15px"><span>您确定导出数据吗?</span></div>');
        }
        if (typeof opts == 'string') {
            $("#EEDlg").dialog(opts, param);
        };
        return this;
    };
    //dataOpts{sheetName:'xxx',cols:[{field:'F_UserName',title:'用户名',datasource:['xxx','xxx']},{}]}
    $.ExportExcelTmp = function (opts, param) {
        var container = $("#EETDlg");
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
                    id: 'EETDlg_btnconfirm',
                    handler: function () {
                        var blob = new Blob([JSXmlExcel.BuildTmpleteXml(opts)], { type: "text/xml;charset=utf-8" });
                        var fs = saveAs(blob, newOpts.SaveName + '.xls')
                        fs.onwriteend = function () {
                            setTimeout(function () {
                                $.showTips("导出成功");
                                container.dialog('close');
                                blob = null;
                            }, 100);
                        };
                    }
                }, {
                    text: '取消',
                    handler: function () {
                        container.dialog('close');
                    }
                }],
            });
            container.append('<div style="margin:15px"><span>确定生成数据填写模板吗？</span></div>');
        }
        if (typeof opts == 'string') {
            $("#EETDlg").dialog(opts, param);
        };
        return this;
    };
})(jQuery);
