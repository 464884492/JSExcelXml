
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
