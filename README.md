JSExcelXml
==========

  js导出excel
JSExcelXML 使用指南

1.功能描述
 JsExcelXml 采用js生成excel中可显示的xml格式文本，将输出文本保存为.xls格式即可,改版本实现功能如下，
	自定义显示位置
	自定义主标题以及样式
	自定义副标题以及样式
	多表头
	数据行合并，列合并
	指定单元格样式
	行背景色
	列背景色
	自定义统计行数据及样式
	导出自定义数据模板
2.依赖资源
Jquery.js
Easyui.js
3.使用方式
var obj = $.ExportExcelDlg({options});
obj.ExportExcelDlg('open');
4. options属性说明
参数名	参数类型	作用
HeadInfo	Array	定义输出Excel中表头信息
MainTitle	Object 	定义输出Excel中自定主标题信息
SecondTitle	Object 	定义输出Excel中自定副标题信息
RowInfo	Array	定义输出Excel 行数据
FooterInfo	Array 	定义输出Excel 行末数据
MergeCells	Array 	定义需要合并单元格的数据
CellStyles	Array 	定义单元格样式
RowStart	Number 	定义导出Excle在第几行开始绘制数据
ColumStart	Number 	定义导出Excel在第几列开始绘制数据
SheetName	String 	定义导出Excel对应Sheet名称
SaveName	String 	定义保存文件名称
Swf	string 	保存文件swf地址

	HeadInfo 格式
 [[
  { field: 'F_UserID', title: '公告ID', hidden: true, rowspan:3,formatter:function(value,x,x), datatype: 'Number' },
 { field: 'F_RealName', title: '姓名', rowspan: 3 bgcolor:"#FF0000"},
 { field: 'F_LoginName', title: '登录名',rowspan: 3 },
 { field: 'F_Password', title: '密码', rowspan: 3，datatype: 'Number'},
 { title: '多表头', colspan: 5 }
  ], [
 { field: 'F_UserNick', title: '昵称',rowspan:2},
{ field: 'F_IdNumber', title: '身份证号', rowspan:2 },
 { title: '多表3', colspan: 3}
  ], [
  { field: 'F_Tel', title: '电话'},
  { field: 'F_BirthDate', title: '生日' },
  { field: 'F_EMail', title: '邮箱' },
  ]]
采用easyui-datagrid 定义列格式，采用多维数组标记实现多维表头绘制方式，直接在easyui-datagrid 中可使用 $(‘xxx’).datagrid(‘options’). Columns 获取,但为获得更好显示效果，扩展属性 datatype，bgcolor
属性	作用
field	取数字段
title	显示名称
hidden	是否隐藏，为true不会在excel中绘制该列，在直接调用easyui会出现此属性
rowspan	跨越行
colspan	跨越列
datatype	数据类型 ‘'Number'’ 默认生成为string类型，若有此标记excel中将自动转换成数字类型
bgcolor	该列背景色标准16进制表示 如：‘#FFFFFF’
formatter	只转换方法 如实现，改列原值为1，调用自定义formatter,可将value*10导出

	RowInfo
[{“Field1”:’张三’,’Filed2’:10,’ BgColor’:’#00FF00’},
{“Field1”:’李四’,’Filed2’:20,’ BgColor’:’#0000FF’}]
属性	作用
 ‘key’:’value’	显示数据列/值
BgColor	行特殊字段，用于绘制改行背景色，若无特别需求，可不用保留改字段

	FooterInfo
 [{“Field1”:’合计’,’ Filed2’:30 },
{“Field1”:’平均’,’ Filed2’:15 }]
属性	作用
 ‘key’:’value’	显示数据列/值

	MainTitle，SecondTitle 格式
{ Displayname: '主标题/副标题', Alignment: 'Center', BgColor: '#FFFFFF', FontSize: 16, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false }
属性	作用
Displayname	主标题内容
Alignment	对齐方式 ‘Center’,’Left’,’Right’ 
BgColor	背景色
FontSize	字体大小
FontColor	字体颜色
IsBold	是否加粗
IsItalic	是否倾斜
IsUnderLine	是否有下划线

	HeadStyle，DataStyle，FootStyle
 { Alignment: 'Center', BgColor: '#D8D8D8', FontSize: 12, FontColor: "#000000", IsBold: true, IsItalic: false, IsUnderLine: false }
属性	作用
Alignment	对齐方式 ‘Center’,’Left’,’Right’ 
BgColor	背景色
FontSize	字体大小
FontColor	字体颜色
IsBold	是否加粗
IsItalic	是否倾斜
IsUnderLine	是否有下划线

	MergeCells

[{ index: 1, field: 'F_USERNAME', colspan: 4, rowspan: 2 },
{ index: 3, field: 'F_COMPANYNAME', colspan: 2, rowspan: 2 },
{ index: 3, field: 'F_MOBILE', colspan: 2 }]
属性作用
属性	作用
index	在数据RowInfo中的索引值，范围0~ RowInfo.Length
field	对应Filed列开始合并
colspan	跨越列
rowspan	跨越行

	 CellStyles
[{ index: 3, field: 'F_MOBILE', BgColor: "#0000ff" }]
属性	作用
index	在数据RowInfo中的索引值，范围0~ RowInfo.Length
field	对应Filed列开始合并
BgColor	单元格背景色

4.导出数据模板
 1.使用方式
var tmpdlg = $.ExportExcelTmp({options });
tmpdlg.ExportExcelTmp('open');
2.参数说明
{ 
SheetName: '用户数据模板',
 HeadInfo: [{ field: 'F_STATE', title: '账户状态', datasource: ['有效#1#', '无效#0#'] }],
SaveName: '用户数据导入模板',
 Swf: '../../../CommJs/ExportExcel.swf'
}
属性	作用
SheetName	模板Sheet名称
HeadInfo	模板列信息
SaveName	模板名称
Swf	保存文件swf地址

	HeadInfo
属性	作用
field	 列字段
title	显示名称
datasource	数据源[‘value#key#’，‘value2#key2#’]

