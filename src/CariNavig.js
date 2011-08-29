/*CariNavig, navigation inside a SVG canvashttp://ybochatay.frCopyright 2011, Yannick BochatayThis program is free software: you can redistribute it and/or modifyit under the terms of the GNU General Public License as published bythe Free Software Foundation, either version 3 of the License, or(at your option) any later version.This program is distributed in the hope that it will be useful,but WITHOUT ANY WARRANTY; without even the implied warranty ofMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See theGNU General Public License for more details.You should have received a copy of the GNU General Public Licensealong with this program.  If not, see <http://www.gnu.org/licenses/>.*/if (window.SVGSVGElement && window.SVGSVGElement.prototype) {	window.SVGSVGElement.prototype.cariNavig = function(opt)	{		"use strict";			if (this.navig) {			if (opt) { this.navig.set(opt);}			return this;		}			var svg = this,		largInit = svg.cssInt('width'),		hautInit = svg.cssInt('height'),		cursorInit = svg.css('cursor'),		self = this,				set = function(opt) // fonction pour d�finir les options		{			for (var n in opt) {				if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {					this[n] = opt[n];				}			}						return this;		},				frame = (function() {//ajout d'un �l�ment g qui contient tous les �l�ments et g�re le zoom global			var g = svg.newElmt('g'),			child,			exclude = {				tags :['switch','defs'],				list : []			};						g.css('width',largInit);			g.css('height',hautInit);						while (svg.firstChild) {				child = svg.firstChild;				child.parentNode.removeChild(child);				if (exclude.tags.indexOf(child.tagName)!==-1) { exclude.list.push(child); }				else { g.appendChild(child); }			}						svg.appendChild(g);			exclude.list.forEach(function(node) { svg.appendChild(node); });						return g;					})();							this.navig = {			frame : frame,						set : function(opt) {							var tab = ['zoom','mobility','resize','cookie'],				methode;								for (var n in opt)				{					if (opt.hasOwnProperty(n))					{						if (tab.indexOf(n)!==-1) {														methode = (opt[n] === false) ? 'off' : 'on' ;							if (this[n][methode]) { this[n][methode](opt[n]); }						}					}				}											return this;			},							zoom : {								key : false,				step : 0.1,								set : set,								change : function(opt) {					opt = opt || {};					if (typeof opt == 'number') { opt = {coef:opt}; }										var larg = svg.cssInt('width'),					top = svg.cssInt('height'),					mtx = frame.getMtx(),										coef = opt.coef,					center = opt.center || svg.point(larg/2,top/2).matrixTransform(frame.getCTM().inverse()),					animate = (opt.animate === true ) ? {duration:300,step:50,style:'swing'} : (typeof opt.animate === 'object' ? opt.animate : false),					callback = opt.callback || false,										scale = mtx.getScaleX(),					scaleTest = mtx.scale(coef).getScaleX();										if (scaleTest < larg / largInit ) {						var inv = mtx.inverse();						mtx = mtx.translate(inv.getX(),inv.getY()).scale(larg / (largInit*scale));						if (!animate || !frame.cariAnim) { frame.setMtx(mtx); }						else						{							animate.to = mtx;							animate.originX = 'left';							animate.originY = 'top';							frame.cariAnim(animate);														}						return;					}															mtx = mtx.translate(center.x,center.y).scale(coef).translate(-center.x,-center.y);										var hg = svg.point(0,0).matrixTransform(mtx.inverse()),					bd = svg.point(larg,top).matrixTransform(mtx.inverse());																	if (hg.x < 0) {mtx = mtx.translate(hg.x,0);}					if (hg.y < 0) {mtx = mtx.translate(0,hg.y);}					if (bd.x > largInit) {mtx = mtx.translate(bd.x-largInit,0);}					if (bd.y > hautInit) {mtx = mtx.translate(0,bd.y-hautInit);}											if (!animate || !frame.cariAnim) {						frame.setMtx(mtx);						if (callback) { callback(); }					}					else					{						animate.to = mtx;						animate.originX = 'left';						animate.originY = 'top';						if (callback) { animate.callback = callback; }						frame.cariAnim(animate);													}										return this;				},														mousewheel : function(e)				{					if (this.key && !e[this.key]) {return;}					e.preventDefault();										var center = svg.point(e.clientX,e.clientY).matrixTransform(frame.getScreenCTM().inverse()),					coef = 1 + this.step * ( e.wheelDelta/120 || -e.detail/3 );										this.change({coef:coef,center:center});				},								on : function(opt)				{					if (opt) { this.set(opt);}										this.off(); //par pr�caution si plusieurs appels										var mousewheelFct = this.mousewheel.bind(this);										svg.addEventListener('DOMMouseScroll',mousewheelFct,false); //FF					svg.addEventListener('mousewheel',mousewheelFct,false);										this.off = function() {						svg.removeEventListener('DOMMouseScroll',mousewheelFct,false); //FF						svg.removeEventListener('mousewheel',mousewheelFct,false);						return this;					}; 										return this;				},								off : function() {}			},									mobility : {								click : 'left',				key : false,				cursor : 'move',				x : true,				y : true,								set : set,								start : false,				drag : false,				end : false,								translate : function(opt,y) {									opt = opt || {};					if (y !== undefined & typeof opt === 'number' && typeof y === 'number') { opt = {x:opt,y:y}; }										var x = opt.x,					y = opt.y,					animate = (opt.animate === true ) ? {duration:300,step:50,style:'swing'} : (typeof opt.animate === 'object' ? opt.animate : false),										mtxInit = frame.getCTM(),					larg = svg.cssInt('width'),					top = svg.cssInt('height'),					mtx = svg.createSVGMatrix().translate(x,y).multiply(mtxInit),					pt = svg.point(0,0).matrixTransform(mtx.inverse()),					pt2 = svg.point(larg,top).matrixTransform(mtx.inverse());										if (pt.x < 0) {mtx = mtx.translate(pt.x,0);}					if (pt.y < 0) {mtx = mtx.translate(0,pt.y);}					if (pt2.x > largInit) {mtx = mtx.translate(pt2.x-largInit,0);}					if (pt2.y > hautInit) {mtx = mtx.translate(0,pt2.y-hautInit);}										if (!animate || !frame.cariAnim) { frame.setMtx(mtx); }					else					{						animate.to = mtx;						animate.originX = 'left';						animate.originY = 'top';						frame.cariAnim(animate);					}										return this;				},								mousedown : function(e)				{					var opt = this;					if ( (e.button==2 && opt.click!='right') || (e.button!=2 && opt.click!='left') || (opt.key && !e[opt.key])) { return;}					e.preventDefault();																svg.style.cursor = opt.cursor;										var mtxInit = frame.getCTM(),					xInit = e.clientX,					yInit = e.clientY,					larg = svg.cssInt('width'),					haut = svg.cssInt('height'),										mousemoveFct = function(e)					{						var transl = {x : (opt.x ? e.clientX-xInit : 0) , y : (opt.y ? e.clientY-yInit : 0) },						mtx = svg.createSVGMatrix().translate(transl.x,transl.y).multiply(mtxInit),						pt = svg.point(0,0).matrixTransform(mtx.inverse()),						pt2 = svg.point(larg,haut).matrixTransform(mtx.inverse());												if (pt.x < 0) {mtx = mtx.translate(pt.x,0);}						if (pt.y < 0) {mtx = mtx.translate(0,pt.y);}						if (pt2.x > largInit) {mtx = mtx.translate(pt2.x-largInit,0);}						if (pt2.y > hautInit) {mtx = mtx.translate(0,pt2.y-hautInit);}												frame.setMtx(mtx);												if (opt.drag) { opt.drag.call(self,e); }					},										remove = function() {						svg.removeEventListener('mousemove',mousemoveFct,false);						svg.style.cursor = cursorInit;						window.removeEventListener('mouseup',remove,false);						if (opt.end) { opt.end.call(self,e); }					};										svg.addEventListener('mousemove',mousemoveFct,false);					window.addEventListener('mouseup',remove,false);										if (opt.start) { opt.start.call(self,e); }				},								on : function(opt)				{						if (opt) { this.set(opt);}																	this.off(); //par pr�caution si plusieurs appels										if (this.click == 'right') { svg.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }																						var mousedownFct = this.mousedown.bind(this);										svg.addEventListener('mousedown',mousedownFct,false);					this.off = function() {svg.removeEventListener('mousedown',mousedownFct,false); return this;};															return this;				},								off : function() {}						},						resize : {								click : 'left',				key : false,				field : false,				x : true,				y : true,				xmin : 100,				ymin : 100,				xmax : 2000,				ymax : 2000,								set : set,								keepRatio : true,				keepViewBox : true,								start : false,				drag : false,				end : false,								change : function(width,height) {									var widthInit = svg.cssInt('width'),					heightInit = svg.cssInt('height'),					mtxInit = frame.getMtx(),					pt1 = svg.point(0,0).matrixTransform(mtxInit.inverse());									svg.css('width',width); frame.css('width',width);										if (this.keepRatio === true) { height = heightInit * width / widthInit; }					else if (height === undefined ) { height = heightInit; }										svg.css('height',height); frame.css('height',height);										if (this.keepViewBox) {						var mtx = mtxInit.translate(pt1.x,pt1.y).scaleNonUniform(width / widthInit , height / heightInit).translate(-pt1.x,-pt1.y);						frame.setMtx(mtx);					}										return this;				},								mousedown : function(e)				{					var opt = this;																	if ( (e.button==2 && opt.click!='right') || (e.button!=2 && opt.click!='left') || (opt.key && !e[opt.key]) ) { return;}					e.preventDefault();										var field,					cursor;										if (opt.field && typeof opt.field == 'string') { field = document.querySelector(opt.field); }					else { field = opt.field || svg; }										if (opt.x === false) {cursor = 'n';}					else if (opt.y === false) {cursor = 'e';}					else {cursor = 'se';}										var cursorInit = field.css('cursor'); 					field.style.cursor = cursor+'-resize';										var xInit = e.clientX,					yInit = e.clientY,					largInit = svg.cssInt('width'),					hautInit = svg.cssInt('height'),					mtxInit = frame.getMtx(),					pt1 = svg.point(0,0).matrixTransform(mtxInit.inverse()),										mousemoveFct = function(e)					{							var decx = e.clientX - xInit,						decy = e.clientY - yInit,						newLarg = Math.min(opt.xmax, Math.max(opt.xmin, largInit + decx) ),						newHaut = Math.min(opt.ymax, Math.max(opt.ymin, hautInit + decy) );																			if (opt.keepRatio) { newLarg = newHaut * largInit / hautInit; }						if (opt.x === false) { newLarg = largInit;}									if (opt.y === false) { newHaut = hautInit;}																							svg.css('width',newLarg);  frame.css('width',newLarg);						svg.css('height',newHaut); frame.css('height',newHaut);						if (opt.keepViewBox) {							var mtx = mtxInit.translate(pt1.x,pt1.y).scaleNonUniform(newLarg / largInit , newHaut / hautInit).translate(-pt1.x,-pt1.y);							frame.setMtx(mtx);						}												if (opt.drag) { opt.drag.call(self,e); }					},										remove = function() {						window.removeEventListener('mousemove',mousemoveFct,false);						field.style.cursor = cursorInit;						window.removeEventListener('mouseup',remove,false);						if (opt.end) { opt.end.call(self,e); }					};										window.addEventListener('mousemove',mousemoveFct,false);					window.addEventListener('mouseup',remove,false);										if (opt.start) { opt.start.call(self,e); }				},								on : function(opt)				{					if (opt) { this.set(opt); }										if (this.x === false || this.y === false) { this.keepRatio= false; }					if (this.click == 'right') { svg.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }										this.off(); //par pr�caution si plusieurs appels															var mousedownFct = this.mousedown.bind(this),					field;					if (this.field && typeof this.field == 'string') { field = document.querySelector(this.field); }					else { field = this.field || svg; }										field.addEventListener('mousedown',mousedownFct,false);					this.off = function() {field.removeEventListener('mousedown',mousedownFct,false);return this;};										return this;				},								off : function() {}				},						cookie : {							expire : false,								set : set,				on : function(opt)				{					if (opt) {						if (typeof opt == 'number') { this.expire = opt; }						else { this.set(opt); }					}									var id = svg.id || 'canevasSVG',					cookie = document.cookies.lire(id),					_this = this,										unloadFct = function()					{						var date;						if (!_this.expire) { date = false; }						else {							date = new Date();							date.setDate(date.getDate()+_this.expire);						}											var valcookie = svg.cssInt('width')+';'+svg.cssInt('height')+';'+frame.getAttribute('transform');						document.cookies.ecrire(id,valcookie,date);											};																if (cookie)					{						var dimensions = cookie.split(';'),						newlarg = dimensions[0],						newhaut = dimensions[1],						newmtx = dimensions[2];						svg.css('width',newlarg); frame.css('width',newlarg);						svg.css('height',newhaut); frame.css('height',newhaut);						frame.setAttribute('transform',newmtx);					}										this.off(); //par pr�caution si plusieurs appels										window.addEventListener('unload',unloadFct,false);										this.off = function() {						window.removeEventListener('unload',unloadFct,false);						document.cookies.effacer(id);						return this;					};										return this;				},								off : function() {}			}		};				if (opt) { this.navig.set(opt); }				return this;	};}