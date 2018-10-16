module.exports = function(RED) {

  function sumBarsNode(config) {
      RED.nodes.createNode(this, config);

      this.on('input', function(msg) {
        this.title = config.title || msg.topic;
        this.period = config.period || 'day';
        this.yMin = config.yMin || 'auto';        
        this.yMax = config.yMax || 'auto';          
        this.showBarsValue = config.showBarsValue;     
        this.showScaleValue = config.showScaleValue;             
        this.showSumValue = config.showSumValue;
        this.maxBar = config.maxBar || 30;   
        this.topColor = config.topColor || '#FF0000';    
        this.bottomColor = config.bottomColor || '#FFFF00'; 
        this.fontColor = config.fontColor || '#AAAAAA';  
        this.barStyle = config.barStyle || 'Rectangle';          
        this.unit = config.unit;  
        this.decimal = config.decimal;     
        if (msg.payload == 'clear') 
          clearNode(this);
        else       
          sumBars(msg,this);
	this.send(msg);

      });
  }

  RED.nodes.registerType("sum-bars", sumBarsNode);
}

function sumBars(msg,myNode) {

// ---------------------------------------------------
// Parameters 
// ---------------------------------------------------
// Original value
var entryValue = msg.payload;
// Graphic title
var title = myNode.title;
// Show values
var showBarsValue = myNode.showBarsValue;
var showScaleValue = myNode.showScaleValue;
var showSumValue = myNode.showSumValue;
// Maximum of bar lines in the graphic
var maxBar = myNode.maxBar;
// bar aspect
var barStyle = myNode.barStyle;
// color of the bottom bar in hexadecimal
var bottomColor = myNode.bottomColor;
// color of the top bar in hexadecimal
var topColor= myNode.topColor;
// Unit symbol
var unit = myNode.unit;
// Number of decimals
var decimal = myNode.decimal;
// font color
var fontColor = myNode.fontColor;
// Title font size
var titleFontSize = '18px';
// Scale font size
var scaleFontSize = '12px';
// Bar font size
var barFontSize = '10px';

// ---------------------------------------------------
// Initialization part
// ---------------------------------------------------

var date = new Date();
var monthName = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
var roundValue = 1;
for(var i=0 ; i<decimal ; i++) {
  roundValue = roundValue * 10;
}
entryValue = Math.round(entryValue*roundValue)/roundValue;

// get last context values
var context = myNode.context();
var previousBar = context.get('previousBar') || -1;
var sum = context.get('sum') || [];
var barName = context.get('barName') || [];

// set values of the x-axis
// ------------------------
// Last hour
if (myNode.period == 'hour') {
  var numberOfBars = 60;
  var barWidth = '1.6%';
  var currentBar = date.getMinutes();
  var myHour = date.getHours();
  var barName = [];  
  var barLongName = [];  
  var startNumber = 0;
  
  for(var i=0 ; i<numberOfBars ; i++) {
	if (i<10)  
	  barName[i]='0'+i;
	else  
	  barName[i]=''+i;
	if ((currentBar-i)<0)  
	  barLongName[i]= (myHour-1) + 'h' + barName[i];
	else
	  barLongName[i]= (myHour) + 'h' + barName[i];  
  }

 }

// Last day
if (myNode.period == 'day') {
  var numberOfBars = 24;
  var barWidth = '4.1%';
  var currentBar = date.getHours();
  var barName = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
  var barLongName = [];  
  var startNumber = 0;  
  for(var i=0 ; i<numberOfBars ; i++) {
    barLongName[i]= barName[i]+'h';
  }
}

// Last week
if (myNode.period == 'week') {
  var numberOfBars = 7;
  var barWidth = '14%';
  var currentBar = date.getDay();
  var barName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var barLongName = [];  
  var startNumber = 0;  
  barLongName = barName.slice(); 
}

// Last month
if (myNode.period == 'month') {
  // calculate number of days (last day of the previous month)
  var previousMonth = date.getMonth();
  var previousYear = date.getFullYear();  
  if (previousMonth == 0) {
    previousMonth = 12; 
    previousYear = previousYear - 1;
  }
  var date1 = new Date(date.getFullYear(), previousMonth, 0);
  var numberOfBars = date1.getDate();
  
  var barWidth = '3.1%';
  var barName = [];   
  var barLongName = [];  
  var startNumber = 1;  
  var currentBar = date.getDate();  
    
  for(var i=0 ; i<=numberOfBars ; i++) {
	barName[i]= i;
	if (i <= currentBar) {
	  var month = date.getMonth();
	  var year = date.getFullYear();	  
	}
	else {
	  var month = previousMonth-1;	
	  var year = previousYear;
	}
    barLongName[i]= barName[i]+' '+monthName[month]+' '+year;
  }

}

// Last year
if (myNode.period == 'year') {
  var numberOfBars = 12;
  var barWidth = '8%';
  var currentBar = date.getMonth();
  var startNumber = 0;  
  var barName = monthName.slice();
  var barLongName = ['january','february','march','april','may','june','july','august','september','october','november','december'];  
}

// msg.topic
if (myNode.period == 'topic') {
  if (barName.indexOf(msg.topic) == -1) {
	barName.push(msg.topic);  
	sum.push(0);
  }
  var currentBar = barName.indexOf(msg.topic); 
  var numberOfBars = barName.length;
  var barWidth = (Math.floor(10/numberOfBars)*10)+'%';
  barLongName = barName.slice();  
}


// ----------
// change bar
// ----------
if ((previousBar!=currentBar) && (myNode.period != 'topic')) {
    context.set('previousBar',currentBar);
    sum[currentBar]=0;       
}

// ---------------------------------------------------
// Calculate the colors of the bars
// ---------------------------------------------------
var barColors = [];
// Extract rgb bottom colors
var redBottomColor = parseInt('0x'+bottomColor.substr(1,2));
var greenBottomColor = parseInt('0x'+bottomColor.substr(3,2));
var blueBottomColor = parseInt('0x'+bottomColor.substr(5,2));
// Extract rgb top colors
var redTopColor = parseInt('0x'+topColor.substr(1,2));
var greenTopColor = parseInt('0x'+topColor.substr(3,2));
var blueTopColor = parseInt('0x'+topColor.substr(5,2));
// Calculate rgb steps
var redIndex = (redTopColor - redBottomColor ) / maxBar;
var blueIndex = (blueTopColor - blueBottomColor) / maxBar;
var greenIndex = (greenTopColor - greenBottomColor) / maxBar;
// Calculate each bar color
for(var i=0 ; i<=maxBar ; i++) {
    // calculate decimal rgb colors
    redColor = redBottomColor + Math.round(redIndex * i) ;
    greenColor = greenBottomColor + Math.round(greenIndex * i) ;
    blueColor = blueBottomColor + Math.round(blueIndex * i) ;    
    // convert in hexadecimal rgb colors
    hexRedColor = redColor.toString(16);
    if ( hexRedColor.length === 1 ) hexRedColor = '0'+ hexRedColor;
    hexGreenColor = greenColor.toString(16);
    if ( hexGreenColor.length === 1 ) hexGreenColor = '0'+ hexGreenColor;
    hexBlueColor = blueColor.toString(16);
    if ( hexBlueColor.length === 1 ) hexBlueColor = '0'+ hexBlueColor;    
    // store bar color
    barColors[i]= '#' + hexRedColor + hexGreenColor + hexBlueColor;
}

// ---------------------------------------------------
// Calculate the sum
// ---------------------------------------------------

// calculate the sum of the current bar
sum[currentBar]=Math.round(((sum[currentBar])+entryValue)*roundValue)/roundValue;

// ---------------------------------------------------
// Calculate the minimum and the maximum
// ---------------------------------------------------
var minimum=entryValue;
var maximum=entryValue;
var sumValue=0;


for(var i=0 ; i<numberOfBars ; i++) {
  if (sum[i]) {

    // Minimum
    if (minimum > sum[i]) {
      minimum = sum[i];
    }

    // Maximum
    if (maximum < sum[i]) {
      maximum = sum[i];
    }
    
    // Sum
    sumValue = sumValue + sum[i];

  }

  if (!showScaleValue) {
    barName[i] = "'";
  }
  
}

var minimumValue = minimum;
var maximumValue = maximum;


// min & max of the scale
if (myNode.yMin == 'auto')
	minimum = Math.floor(minimum-(minimum*0.01));
else
	minimum = myNode.yMin;
	
if (myNode.yMax == 'auto')	
	maximum = Math.ceil(maximum+(maximum*0.01));
else
	maximum = myNode.yMax;


// ---------------------------------------------------
// populate the payload
// --------------------------------------------------- 
msg.payload = {};
msg.payload.bar = [];
msg.payload.barName = barName;
msg.payload.barLongName = barLongName;
msg.payload.sum = [];
msg.payload.number = [];
msg.payload.title = title;
msg.payload.mini = minimum;
msg.payload.maxi = maximum;
msg.payload.colors = barColors;
msg.payload.barWidth = barWidth;
msg.payload.colspan = Math.floor(numberOfBars/2);
msg.payload.unit = unit;
msg.payload.fontColor = fontColor;
msg.payload.titleFontSize = titleFontSize;
msg.payload.scaleFontSize = scaleFontSize;
msg.payload.barFontSize = barFontSize;
msg.payload.barStyle = barStyle;


// Show main values 
if (!showBarsValue) 
    msg.payload.showBarsValue = 'none';

if (!showScaleValue) {
    msg.payload.showScaleValue = 'hidden';    
}
    
    
if (showSumValue) {
    msg.payload.sumValue = sumValue.toString() + unit;
    msg.payload.sumColor = msg.payload.lastColor;
}
else
    msg.payload.showSumValue = 'none';
    

// Calculate each bars
for(var i=0 ; i<numberOfBars ; i++) {

    // Find the good bar in the array
    if (myNode.period=='topic') 
      msg.payload.bar[i]=i;
    else { 
      msg.payload.bar[i]=currentBar+i+1;
      if (msg.payload.bar[i]>(numberOfBars-1+startNumber)) 
        msg.payload.bar[i]=msg.payload.bar[i]-numberOfBars;
    }

    // Calculate the sum and the number of lines of each bars
    if ((sum[msg.payload.bar[i]]=='undefined') || (isNaN(sum[msg.payload.bar[i]]))) {
        msg.payload.sum[i]='';  
        msg.payload.number[i]=0;
    }
    else {
        msg.payload.sum[i]=sum[msg.payload.bar[i]];    
        if (msg.payload.sum[i] > maximum)
          msg.payload.number[i] = maxBar;
        else {
          if (msg.payload.sum[i] < minimum)
            msg.payload.number[i] = 0;
          else      
            msg.payload.number[i] = Math.round((msg.payload.sum[i]-minimum)/(maximum-minimum)*maxBar); 
        } 
        if (msg.payload.sum[i] == 0) {
			msg.payload.sum[i]='';  
			msg.payload.number[i]=0;
		}         
    }

}

// save context values
context.set('sum',sum);
context.set('barName',barName);

// populate the template
msg.template = '\
<style>\
    .bar                 { padding: 0 !important; margin: 0 !important;color:#aaaaaa;}\
    .minibarRectangle    { height:4px !important;border-radius: 0px 0px 0px 0px;width:100%;}\
    .minilineRectangle   { height:0px !important;width:100%; background-color:none;}\
    .hiddenlineRectangle { height:3px !important;width:100%; background-color:none;}\
    .minibarEqualizer    { height:4px !important;border-radius: 2px 2px 2px 2px; width:100%;}\
    .minilineEqualizer   { height:2px !important;width:100%; background-color:none;}\
    .hiddenlineEqualizer { height:5px !important;width:100%; background-color:none;}\
    .bottomline          { height:1px !important;width:100%;}\
    .littleline          { height:1px !important;width:3px;}\
</style>\
\
<table id=tabbar width=100% class=bar style="color:{{msg.payload.fontColor}};">\
    <tr>\
        <td colspan="{{msg.payload.colspan+1}}" align=left style="font-size:{{msg.payload.titleFontSize}};">\
            {{msg.payload.title}}\
        </td>\
        <td colspan="{{msg.payload.colspan}}" align=right style="font-size:{{msg.payload.scaleFontSize}};">\
            <span title="chart sum" style="display:{{msg.payload.showSumValue}};color:{{msg.payload.sumColor}}">\
                <ng-md-icon icon="insert_chart" size=18 style="fill:{{msg.payload.fontColor}}">\
                </ng-md-icon>\
                {{msg.payload.sumValue}}&nbsp;\
            </span>\
        </td>\
    </tr>\
    <tr valign=bottom>\
        <td align=right style="font-size:{{msg.payload.scaleFontSize}};width:1%">\
            {{msg.payload.maxi}}{{msg.payload.unit}}&nbsp;\
            <div class="littleline" style="background-color:{{msg.payload.fontColor}}">&nbsp;</div>\
            <div ng-repeat="c in msg.payload.colors">\
                 <div class="hiddenline{{msg.payload.barStyle}}">&nbsp;</div>\
                 <div class="littleline" style="background-color:{{msg.payload.fontColor}}">&nbsp;</div>\
            </div>\
            {{msg.payload.mini}}{{msg.payload.unit}}&nbsp;\
        </td>\
        <td width="{{msg.payload.barWidth}}" align=center ng-repeat="x in msg.payload.bar track by $index">\
            <div style="display:{{msg.payload.showBarsValue}};font-size:{{msg.payload.barFontSize}};color:{{msg.payload.colors[msg.payload.number[$index]]}}">{{msg.payload.sum[$index]}}</div>\
            <div>\
               <md-tooltip md-direction="top">{{msg.payload.barLongName[msg.payload.bar[$index]]}} : {{msg.payload.sum[$index]}}{{msg.payload.unit}}</md-tooltip>\
               <div ng-repeat="c in msg.payload.colors | limitTo : msg.payload.number[$index] track by $index">\
                    <div class="miniline{{msg.payload.barStyle}}">&nbsp;</div>\
                    <div class="minibar{{msg.payload.barStyle}}" style="background-color:{{msg.payload.colors[msg.payload.number[$parent.$index]-$index]}}">&nbsp;</div>\
                </div>\
            <div>\
            <div class="miniline{{msg.payload.barStyle}}">&nbsp;</div>\
            <div class="bottomline">&nbsp;</div>\
            <div  style="visibility:{{msg.payload.showScaleValue}};font-size:{{msg.payload.scaleFontSize}};">{{msg.payload.barName[msg.payload.bar[$index]]}}</div>\
        </td>\
    </tr>\
</table>';


return msg;
};

function clearNode(myNode) {
  var context = myNode.context();	
  context.set('sum',[]);
  context.set('barName',[]);	
};	
