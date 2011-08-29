/*
CariDrag, drag&drop of SVG elements (mobility,resize,rotation)
http://ybochatay.fr

Copyright 2011, Yannick Bochatay

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
if (window.SVGElement && window.SVGElement.prototype) {

window.SVGElement.prototype.cariDrag = function(opt)
{
	"use strict";
	
	if (this.drag) {
		if (opt) { this.drag.set(opt);}
		return this;
	}

	opt = opt || {};
	var evt = opt.evt || false,// pour commencer tout de suite (ex : création de l'élément sur mousedown et resize sur mousemove)
	self = this,
	cursorInit = self.css('cursor'),
	
	set = function(opt)
	{
		for (var n in opt) {
			if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
				this[n] = opt[n];
			}
			else if (n == 'evt') { evt = opt[n];}
		}
	},
	
	ratio = function(dec) {
		if (dec === undefined || dec === 'center') { return 0.5;}
		else if (dec === 'top' || dec === 'left') { return 0;}
		else if (dec === 'bottom' || dec.indexOf('right')!==-1) { return 1;}
	};
		
	this.drag = {
	
		set : function(opt) {
			
			var tab = ['mobility','resize','rotation'],
			methode;

			for (var n in opt)
			{
				if (opt.hasOwnProperty(n))
				{
					if (tab.indexOf(n)!=-1) {
						
						methode = (opt[n] === false) ? 'off' : 'on' ;
						
						if (self.drag[n][methode]) { self.drag[n][methode](opt[n]); }
					}
				}
			}
			
			return this;
		},
							
		mobility : {
			
			click : 'left',
			key : false,
			field : false, //pas de field = self car cela crée une référence circulaire ( objet.propriete = objet )
			className : false,
			x : true,
			y : true,
			xmin : false,
			ymin : false,
			xmax : false,
			ymax : false,
			
			start : false,
			drag : false,
			end : false,
			
			magnet : {
				list:[],
				strength:10,
				x:'center',
				y:'center',
				className:'magnet',
				require:false,
				callback:false
			},
			
			mousedown : function(e) {
				
				var cursor,
				opt = this,
				field;
				
				if (typeof opt.field == 'string') { field = document.querySelectorAll(field); }
				else if (opt.field instanceof Array) {field = opt.field;}
				else if (typeof opt.field == 'object' && !(opt.field instanceof NodeList)) { field = [opt.field];}
				else if (!opt.field) { field = [self]; }

				if ( (e.button==2 && opt.click!='right') || (e.button!=2 && opt.click!='left') || (opt.key && !e[opt.key])) { return;}
				
				e.preventDefault();
				
				if (opt.x && opt.y) {cursor = 'move';}
				else if (opt.x) {cursor = 'e-resize';}
				else {cursor = 'n-resize';}
				
				field.forEach(function(field) {
					field.style.cursorInit = (field === self) ? cursorInit : field.css('cursor');
					field.style.cursor = cursor;
				});
				
				if (opt.className) { self.classList.add(opt.className); }
				
				var CTMInit = self.getCTM(),
				mtxInit = self.getMtx(),
				svg = self.getSVG(),
				mtxParent = (self.parentNode == svg) ? self.parentNode.createSVGMatrix() : self.parentNode.getCTM().inverse(),
				mtxScreenParent = (self.parentNode == svg) ? self.parentNode.createSVGMatrix() : self.parentNode.getScreenCTM().inverse(),
				xInit = e.clientX,
				yInit = e.clientY,
				listMagnet;
								
				//calcul des coordonnées des aimants
				if (opt.magnet)
				{					
					if (opt.magnet.list) {
						if (typeof opt.magnet.list == 'string') { listMagnet = document.querySelectorAll(opt.magnet.list); }
						else if (opt.magnet.list instanceof Array || opt.magnet.list instanceof NodeList) { listMagnet = opt.magnet.list; }
					}
					
					if (listMagnet && listMagnet.length > 0) {
				
						var mtxScreen = self.parentNode.getScreenCTM(),
						list,
						
						dec = {
							x : ratio(opt.magnet.x),
							y : ratio(opt.magnet.y)
						},
						
						bounds = self.getBoundingClientRect(), //dimensions à l'écran
					
						ref = { //point de référence pour l'aimantation
							x : bounds.left + bounds.width * dec.x,
							y : bounds.top + bounds.height * dec.y
						};
					
						listMagnet.forEach(function(magnet) {
							
							if (magnet.getBoundingClientRect)
							{
								var b = magnet.getBoundingClientRect();
								magnet.left = b.left+b.width * dec.x;
								magnet.top = b.top+b.height * dec.y;
							}
							else
							{
								var pt = svg.point(magnet.x,magnet.y).matrixTransform(mtxScreen);
								magnet.left = pt.x;
								magnet.top = pt.y;
							}
						});
					}
				}
											
				var mousemoveFct = function(e)
				{							
					var transl = {x : (opt.x ? e.clientX-xInit : 0) , y : (opt.y ? e.clientY-yInit : 0) };
					
					if (opt.magnet) {
						
						opt.magnet.ok = false;
						if (opt.magnet.className) { self.classList.remove(opt.magnet.className); }
						
						var magnet;
					
						//si on est près d'un field aimanté
						for (var i=0,N=listMagnet.length;i<N;i++)
						{
							magnet = listMagnet[i];
							
							if (Math.abs(e.clientX - xInit + ref.x - magnet.left) < opt.magnet.strength && Math.abs(e.clientY - yInit + ref.y - magnet.top) < opt.magnet.strength) {
								transl.x = magnet.left - ref.x;
								transl.y = magnet.top - ref.y;
								self.classList.add(opt.magnet.className);
								opt.magnet.ok = magnet;
								break;
							}
						}
					}
												
					var mtx = mtxParent.translate(transl.x,transl.y).multiply(CTMInit);
					self.setMtx(mtx);
					
					if (opt.bornes) {
						
						var rect = self.getBoundingClientRect(),
						hg = svg.point(rect.left,rect.top).matrixTransform(mtxScreenParent), //coin top left
						bd = svg.point(rect.right,rect.bottom).matrixTransform(mtxScreenParent), //coin bottom droite
						x=0,y=0;	
						
						if (opt.xmin!==false && hg.x < opt.xmin) { x = opt.xmin - hg.x; }
						if (opt.ymin!==false && hg.y < opt.ymin) { y = opt.ymin - hg.y;	}
						if (opt.xmax!==false && bd.x > opt.xmax) { x = opt.xmax - bd.x;	}
						if (opt.ymax!==false && bd.y > opt.ymax) { y = opt.ymax - bd.y;	}
														
						mtx = svg.createSVGMatrix().translate(x,y).multiply(mtx);
						
						self.setMtx(mtx);
					}
					
					if (opt.drag) { opt.drag.call(self,e); }
				};
				
				svg.addEventListener('mousemove',mousemoveFct,false);
				
				window.addEventListener('mouseup',function remove(e) {
					if (opt.magnet) {
						if (opt.magnet.className) { self.classList.remove(opt.magnet.className); }
						if (opt.magnet.ok) {
							if (opt.magnet.callback) {opt.magnet.callback.call(self,opt.magnet.ok);}
						}
						else if (opt.magnet.require) {
							if (self.cariAnim) {
								self.cariAnim({
									to:mtxInit,
									duration:300,
									style:'swing'
								});
							} else {
								self.setMtx(mtxInit);
							}
						}
					}
					if (opt.className) { self.classList.remove(opt.className);}
					field.forEach(function(field) {	field.style.cursor = field.style.cursorInit;});
					svg.removeEventListener('mousemove',mousemoveFct,false);
					window.removeEventListener('mouseup',remove,false);
					
					if (opt.end) { opt.end.call(self,e); }
					
				},false);
				
				if (opt.start) { opt.start.call(self,e); }
			},
			
			set : set,
			
			on : function(opt) {
		
				if (opt) { this.set(opt);}
				opt = this;
				
				this.bornes = (this.xmin!==false || this.ymin!==false || this.xmax!==false || this.ymax!==false) ? true : false;
				
				this.off();
				
				var mousedownFct = this.mousedown.bind(this),
				field;
				
				if (typeof this.field == 'string') { field = document.querySelectorAll(field); }
				else if (this.field instanceof Array) {field = this.field;}
				else if (typeof this.field == 'object' && !(this.field instanceof NodeList)) { field = [this.field];}
				else if (!this.field) { field = [self]; }
				
				field.forEach(function(field) {
					if (opt.click == 'right') { field.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }
					field.addEventListener('mousedown',mousedownFct,false);
				});
				
				this.off = function() {
					field.forEach(function(field) {
						field.removeEventListener('mousedown',mousedownFct,false);
					});
					return this;
				};
				
				if (evt) { mousedownFct(evt);}
				
				return this;
			},
			
			off : function() {}
		},
		
		resize : {
			
			click : 'right',
			key : false,
			field : false,
			className : false,
			x : true,
			y : true,
			magnet : false,
			xmin : 5,
			ymin : 5,
			xmax : 3000,
			ymax : 3000,
			originX : 'center',
			originY : 'center',
			inverse : false,
			
			keepRatio : true,
			
			start : false,
			drag : false,
			end : false,
			
			mousedown : function(e) {
				
				var opt = this,
				field;

				if (typeof this.field == 'string') { field = document.querySelectorAll(field); }
				else if (this.field instanceof Array) {field = this.field;}
				else if (typeof this.field == 'object' && !(this.field instanceof NodeList)) { field = [this.field];}
				else if (!this.field) { field = [self]; }
				
				if ( (e.button==2 && opt.click!='right') || (e.button!=2 && opt.click!='left') || (opt.key && !e[opt.key]) ) { return;}
				
				e.preventDefault();
				
				var cursor;
				if (opt.x === false) {cursor = 'n';}
				else if (opt.y === false) {cursor = 'e';}
				else {cursor = 'se';}
				
				field.forEach(function(field) {
					field.style.cursorInit = (field === self) ? cursorInit : field.css('cursor');
					field.style.cursor = cursor+'-resize';
				});
				
				if (opt.className) { self.classList.add(opt.className); }
				
				var dec = self.getShift(opt.originX, opt.originY);
				
				if (opt.x === false) { dec.x = 0; }
				else if (opt.y === false) { dec.y = 0; }
				
				var mtxInit = self.getMtx(),
				bounds = self.getBoundingClientRect(), //dimensions à l'écran
				largInit = bounds.width, hautInit = bounds.height,
				xInit = e.clientX, yInit = e.clientY,
				box = self.getBBox(),
																
				mousemoveFct = function(e)
				{							
					//pour un décalage depuis le center, il faut *2 pour suivre le mvt de la souris
					var scaleX = 1 + (opt.originX == 'center' ? 2 : 1) * (e.clientX - xInit) / largInit,
					scaleY = 1 + (opt.originY == 'center' ? 2 : 1) * (e.clientY - yInit) / hautInit;
					
					if (opt.x === false) { scaleX = 1; }
					else if (opt.y === false) { scaleY = 1; }
					else if (opt.keepRatio) { scaleX = scaleY;}
					
					//on décale d'abord selon l'axe de rotation
					var mtx = mtxInit.translate(dec.x,dec.y).scaleNonUniform(scaleX,scaleY);
					
					var newScaleX = mtx.getScaleX(),
					newScaleY = mtx.getScaleY(),
					newLarg = box.width * newScaleX,
					newHaut = box.height * newScaleY,
					mtxInv;
					
					//pour ne step retourner l'élément, sauf si inverse=true
					if (!opt.inverse && (mtx.a/Math.abs(mtx.a) != mtxInit.a/Math.abs(mtxInit.a) || mtx.d/Math.abs(mtx.d) != mtxInit.d/Math.abs(mtxInit.d))) { return;}
												
					if (newLarg < opt.xmin || newLarg > opt.xmax) {
						
						if (opt.keepRatio) { return ;}
						else {
							try {
								mtxInv = mtx.inverse();
								mtx = mtx.scaleNonUniform(mtxInv.getScaleX(),1).scaleNonUniform( (newLarg < opt.xmin ? opt.xmin : opt.xmax ) / box.width , 1);
							} catch(e) {}
						}
					}
					
					if (newHaut < opt.ymin || newHaut > opt.ymax)
					{
						if (opt.keepRatio) { return ;}
						else {
							try {
								mtxInv = mtx.inverse();
								mtx = mtx.scaleNonUniform(1,mtxInv.getScaleY()).scaleNonUniform(1, (newHaut < opt.ymin ? opt.ymin : opt.ymax ) / box.height);
							} catch(e) {}
						}
					}
												
					if (opt.magnet)
					{
						if (!opt.keepRatio)
						{
							if (Math.abs(1-newScaleX) < opt.magnet) {mtx = mtx.scaleNonUniform(mtx.inverse().getScaleX(),1);} //on recale à l'échelle 1
							if (Math.abs(1-newScaleY) < opt.magnet) {mtx = mtx.scaleNonUniform(1,mtx.inverse().getScaleY());}
						}
						else if (Math.abs(1-newScaleY) < opt.magnet) {mtx = mtx.scale(mtx.inverse().getScaleY());}
					}
					
					//on repositionne au bon endroit																				
					mtx = mtx.translate(-dec.x,-dec.y);
																				
					self.setMtx(mtx);
					
					if (opt.drag) { opt.drag.call(self,e); }
				};
	
				window.addEventListener('mousemove',mousemoveFct,false);
				window.addEventListener('mouseup',function remove() {
					if (opt.className) { self.classList.remove(opt.className);}
					field.forEach(function(field) { field.style.cursor = field.style.cursorInit; });
					window.removeEventListener('mousemove',mousemoveFct,false);
					window.removeEventListener('mouseup',remove,false);
					if (opt.end) { opt.end.call(self,e); }
				},false);
				
				if (opt.start) { opt.start.call(self,e); }
			},						
			
			set : set,
			
			on : function(opt) {
				
				if (opt) { this.set(opt);}
				opt = this;
																		
				if (this.x === false || this.y === false) { this.keepRatio= false; }
				
				this.off();
				
				var mousedownFct = this.mousedown.bind(this),
				field;
											
				if (typeof this.field == 'string') { field = document.querySelectorAll(field); }
				else if (this.field instanceof Array) {field = this.field;}
				else if (typeof this.field == 'object' && !(this.field instanceof NodeList)) { field = [this.field];}
				else if (!this.field) { field = [self]; }
				
				field.forEach(function(field) {
					if (opt.click == 'right') { field.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }
					field.addEventListener('mousedown',mousedownFct,false);
				});
				
				this.off = function() {
					field.forEach(function(field) {
						field.removeEventListener('mousedown',mousedownFct,false);
					});
					return this;
				};
				
				if (evt) {mousedownFct(evt); }
				
				return this;
			},
			
			off : function() {}
		},
		
		rotation : {
			
			click : 'left',
			key : 'shiftKey',
			originX : 'center',
			originY : 'center',
			className : false,
			field : false,
			
			start : false,
			drag : false,
			end : false,
			
			mousedown : function(e) {
				
				var opt = this,
				field;
				
				if (typeof this.field == 'string') { field = document.querySelectorAll(field); }
				else if (this.field instanceof Array) {field = this.field;}
				else if (typeof this.field == 'object' && !(this.field instanceof NodeList)) { field = [this.field];}
				else if (!this.field) { field = [self]; }
				
				if ( (e.button==2 && opt.click!='right') || (e.button!=2 && opt.click!='left') || (opt.key && !e[opt.key]) ) { return;}
				
				e.preventDefault();
				
				field.forEach(function(field) {
					field.style.cursorInit = (field === self) ? cursorInit : field.css('cursor');
					field.style.cursor = 'n-resize';
				});
				
				if (opt.className) { self.classList.add(opt.className); }
				
				var mtxInit = self.getMtx(),
				dec = self.getShift(opt.originX,opt.originY),
				yInit = e.clientY,
				
				mousemoveFct = function(e){
					self.setMtx(mtxInit.translate(dec.x,dec.y).rotate(e.clientY-yInit).translate(-dec.x,-dec.y));
					if (opt.drag) { opt.drag.call(self,e); }
				};
				
				window.addEventListener('mousemove',mousemoveFct,false);
				window.addEventListener('mouseup',function remove() {
					if (opt.className) { self.classList.remove(opt.className);}
					field.forEach(function(field) { field.style.cursor = field.style.cursorInit; });
					window.removeEventListener('mousemove',mousemoveFct,false);
					window.removeEventListener('mouseup',remove,false);
					if (opt.end) { opt.end.call(self,e); }
				} ,false);
				
				if (opt.start) { opt.start.call(self,e); }
			},
			
			set : set,
			
			on : function(opt) {

				if (opt) { this.set(opt);}
				opt = this;
				
				this.off();
				
				var mousedownFct = this.mousedown.bind(this),
				field;
				
				if (typeof this.field == 'string') { field = document.querySelectorAll(field); }
				else if (this.field instanceof Array) {field = this.field;}
				else if (typeof this.field == 'object' && !(this.field instanceof NodeList)) { field = [this.field];}
				else if (!this.field) { field = [self]; }
				
				field.forEach(function(field) {
					if (opt.click == 'right') { field.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }
					field.addEventListener('mousedown',mousedownFct,false);
				});
				
				this.off = function() {
					field.forEach(function(field) {
						field.removeEventListener('mousedown',mousedownFct,false);
					});
					return this;
				};
											
				if (evt) { mousedownFct(evt); }
				
				return this;
			},
			
			off : function() {}
		}				
	};
	
	if (opt) { this.drag.set(opt);}
	return this;
};

}