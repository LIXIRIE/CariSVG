/*
CariCore
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
(function() {
	
	"use strict";
	
	var customMethods = function(elmt,methods)
	{
		for (var n in methods){
			if (methods.hasOwnProperty(n))
			{
				if (elmt[n]===undefined) {elmt[n] = methods[n];}
			}
		}

		return elmt;
	},
	
	customProperties = function(elmt,properties)
	{
		for (var n in properties){
		
			if (properties.hasOwnProperty(n))
			{
				try {
					if (elmt[n]===undefined) {
						if (Object.defineProperty) {
							Object.defineProperty(elmt,n,{get:properties[n]});
						}
						else if (elmt[n].__defineGetter__) {
							elmt[n].__defineGetter__(n, properties[n]);
						}
					}
				}
				catch(e) {}
			}
		}

		return elmt;
	},
	
	Methods =
	{
		Function :
		{
			bind : function(contexte) //JavaScript 1.8.5
			{
				var _slice = Array.prototype.slice,
				_concat = Array.prototype.concat,
				_arguments = _slice.call(arguments,1),
				self = this;
				return function() { return self.apply(contexte,_concat.call(_arguments,_slice.call(arguments,0))); };
			}
		},
		
		Array :
		{
			remove : function(elem)
			{
				return this.splice(this.indexOf(elem),1);
			},
			
			rand : function() { return this[ Math.rand(0,this.length-1) ]; }
		},
		
		String :
		{
			forEach : function(fct) {
				Array.prototype.forEach.call(this,fct); return this;
			}
		},
		
		NodeList : 
		{
			forEach : function(fct) { Array.prototype.forEach.call(this,fct); return this;}
		},
	
		SVGMatrix :
		{
			getScaleX : function() {return Math.sqrt(Math.pow(this.a,2)+Math.pow(this.b,2)); },
			
			getScaleY : function() { return Math.sqrt(Math.pow(this.c,2)+Math.pow(this.d,2)); },
			
			getAngle : function() { return Math.atan2(this.b, this.a) * 180 / Math.PI; },
			
			getX : function() { return this.e; },
			
			getY : function() { return this.f; },
		
			toAttr : function() { return 'matrix('+this.a+','+this.b+','+this.c+','+this.d+','+this.e+','+this.f+')'; }
		},
		
		SVGSVGElement :
		{
			NS : "http://www.w3.org/2000/svg",
			
			XLINK : "http://www.w3.org/1999/xlink",

			newElmt : function(tag,attrs)
			{					
				if (tag == 'CariCurve' && document.createCariCurve) { return document.createCariCurve(attrs); }
				
				var elmt = document.createElementNS(this.NS,tag);
				elmt.attr(attrs);
				return elmt;
			},
			
			addElmt : function(tag,attrs)
			{
				var elmt = this.newElmt(tag,attrs);
				this.appendChild( elmt );
				return elmt;
			},
			
			point : function(x,y) { var pt = this.createSVGPoint(); pt.x = x; pt.y = y; return pt; },
			
			css : function(prop,val) { return window.SVGElement.prototype.css.call(this,prop,val); },
			
			cssInt : function(prop) { return window.SVGElement.prototype.cssInt.call(this,prop); },

			getSVG : function() { return this;} //permet de traiter l'élément svg de la même manière que les autres
		},
			
		SVGElement :
		{
			NS : "http://www.w3.org/2000/svg",
			
			XLINK : "http://www.w3.org/1999/xlink",
		
			getSVG : function() {
				
				var getSVG = function(elmt) {
					var parent = elmt;
					do { parent = parent.parentNode; }
					while (parent && parent.nodeName.toLowerCase()!='svg');
					return parent;
				};
				
				try {
					if (this.ownerSVGElement) {return this.ownerSVGElement;} //ownerSVGElement renvoie une exception si pas dispo
					else { return getSVG(this); }
				}
				catch(e) { return getSVG(this);}
			},
			
			getMtx : function()
			{
				var transf = this.getAttribute('transform'),
				tab = [],
				mtx = this.getSVG().createSVGMatrix();
												
				if (!transf || transf.indexOf('matrix') === -1) { tab = [1,0,0,1,0,0];}
				else {tab =  /matrix\((.+)\)/.exec(transf)[1].split(/, *| /);}
				
				mtx.a = tab[0]; mtx.b = tab[1]; mtx.c = tab[2]; mtx.d = tab[3]; mtx.e = tab[4]; mtx.f = tab[5];
				return mtx;
			},
			
			setMtx : function(mtx) {
				
				this.setAttribute('transform',mtx.toAttr());
				return this;
			},
			
			attr : function(attr,val)
			{
				if (typeof attr === 'string') {
					if (!val) { return this.getAttribute(attr); }
					else { this.setAttribute(attr,val); }
				}
				else if (typeof attr === 'object') {
					for (var n in attr) {
						if (attr.hasOwnProperty(n)) {
							if (typeof attr[n] === 'object' && n === 'style') { this.css(attr[n]); }
							else { this.attr(n,attr[n]); }
						}
					}
				}

				return this;
			},
			
			remove : function() {
				if (this.parentNode) {this.parentNode.removeChild(this);}
				return this;
			},
			
			newElmt : function(tag,attrs)
			{					
				if (tag == 'CariCurve' && document.createCariCurve) { return document.createCariCurve(attrs); }
				
				var elmt = document.createElementNS(this.NS,tag);
				elmt.attr(attrs);
				return elmt;
			},
			
			addElmt : function(tag,attrs)
			{
				var elmt = this.newElmt(tag,attrs);
				this.appendChild(elmt);
				return elmt;
			},
			
			getShift : function(originX,originY)
			{
				originX = (originX || originX === 0) ? originX : 'center';
				originY = (originY || originY === 0) ? originY : 'center';
				
				if (typeof(originX) == 'number' && typeof(originY) == 'number') {return {x:originX,y:originY};}
				
				var box = this.getBBox(), // dimensions réelles de l'élément (avant transformation(s))
				translX,translY; 
								
				switch (originX)
				{
					case 'left' : translX = 0; break; 
					case 'right' : translX = box.width; break;
					default : translX = box.width/2; break;
				}
				
				switch (originY)
				{
					case 'top' : translY = 0; break; 
					case 'bottom' : translY = box.height; break;
					default : translY = box.height/2; break;
				}
				
				return this.getSVG().point(box.x+translX,box.y+translY);
			},
			
			css : function(prop,val)
			{
				if (typeof(prop) == 'object') { //appel récursif si on passe un objet en paramètre
					for (var n in prop) {
						if (prop.hasOwnProperty(n)) {this.css(n,prop[n]); }
					}
					return this;
				}
				
				var jsFormat = prop.replace(/-[a-z]/,function($1){return $1.substr(1).toUpperCase();}),
				cssFormat =  prop.replace(/[A-Z]/,function($1){return '-'+$1.toLowerCase();});
							
				if (val!==undefined) //Ecriture
				{
					if (this.getAttribute) {this.setAttribute(cssFormat,val);}
					if (this.style && this.style[jsFormat]!==undefined) {
						if ((jsFormat == 'width' || jsFormat == 'height') && !/px/.test(val)) { val+='px'; }
						this.style[jsFormat] = val;
					}
					return this;
				}
				else  //Lecture
				{
					//propriété écrite en dur (soit dans la balise, soit déjà forcée en javascript)
					if (this.style && this.style[jsFormat]){val = this.style[jsFormat];}
					 //propriété standard
					else if (this.getAttribute && this.getAttribute(cssFormat)) {val = this.getAttribute(cssFormat);}
					 //écrite dans une feuille de style (W3C)
					else if (window.getComputedStyle){val = window.getComputedStyle(this,null).getPropertyValue(cssFormat) || undefined;} //sinon renvoie une chaîne nulle
					else { val = undefined;}
			
					return val;
				}
			},
			
			cssInt : function(prop)
			{
				var css = this.css(prop);
				var entier = parseInt(css,10);
				return isNaN(entier) ? false : entier;
			}
		}
	},
	
	Properties = {
		
		SVGElement : {
		
			classList : function()
			{
				var self = this;
				
				if (self.getAttribute('class') === null) {self.setAttribute('class','');}
				
				return {
					length : self.getAttribute('class').split(/ +/).length,
				
					add : function(className) { if (self.getAttribute('class').indexOf(className) == -1) {self.setAttribute('class',self.getAttribute('class')+' '+className);} },
					
					remove : function(className){
						var reg = new RegExp('(^| +)'+className);
						if (self.getAttribute('class').indexOf(className) != -1) {self.setAttribute('class',self.getAttribute('class').replace(reg,''));}
					},
					
					contains : function(className){
						var reg = new RegExp('(^| +)'+className);
						return self.getAttribute('class').match(reg) ? true : false;
					},
					
					toggle : function(className) {
						if (self.classList.contains(className)) { self.classList.remove(className);}
						else {self.classList.add(className);}
					}
				};
			},
			
			transf : function() {
				
				var self = this;
				
				return {
					
					reset : function() {
						self.setMtx(self.getSVG().createSVGMatrix());
						return this;
					},
				
					translate : function(x,y) {
				
						self.setMtx(self.getMtx().translate(x,y));
						return this;
					},
					
					scale : function(scale,originX,originY) {
						
						var dec = self.getShift(originX,originY);
						self.setMtx(self.getMtx().translate(dec.x,dec.y).scale(scale).translate(-dec.x,-dec.y));
						return this;
					},
					
					scaleNonUniform : function(echelleX,echelleY,originX,originY) {
						
						var dec = self.getShift(originX,originY);
						self.setMtx(self.getMtx().translate(dec.x,dec.y).scaleNonUniform(echelleX,echelleY).translate(-dec.x,-dec.y));
						return this;
					},
					
					rotate : function(angle,originX,originY) {
						
						var dec = self.getShift(originX,originY);
						self.setMtx(self.getMtx().translate(dec.x,dec.y).rotate(angle).translate(-dec.x,-dec.y));
						return this;
					}
				};
			},
			
			text : function() {
		
				var self = this;
			
				return {
				
					add : function(texte) {
						self.appendChild(document.createTextNode(texte));
						return self;
					},
					
					remove : function() {
						while (self.firstChild && self.firstChild.nodeType == 3) { self.removeChild(self.firstChild); }
						return self;
					},
					
					change : function(texte) {
						this.remove();
						this.add(texte);
						return self;
					},
					
					get : function() {
						var str = '',
						child = self.firstChild;
						do { str+=child.nodeValue;}
						while ((child = child.nextSibling) && child.nodeType == 3)
						return str;
					}
				};
			},
			
			link : function() {
			
				var self = this;
			
				return {
				
					set : function(href)
					{
						self.setAttributeNS(self.XLINK,"href",href);
						return self;
					},
					
					get : function() {return self.getAttributeNS(self.XLINK,"href"); }
				};
			}
		}
	};
	
	Math.rand = function(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
	
	window.getTabFromAnimationStyle = function getTabFromAnimationStyle(style)
	{
		switch (style)
		{
			case 'linear' : return [0,100];
			case 'drop' : return [0,3,10,25,50,100];
			case 'cushion' : return [0,50,75,90,97,100];
			case 'swing' : return [0,3,10,25,50,75,90,97,100];
			case 'bounce' : return [0,10,30,60,120,90,105,100];
			case 'random' : return getTabFromAnimationStyle(['linear','drop','cushion','swing','bounce'].rand());
			case 'full-random' :
				var tab = [0], nb = 5, i = 1;
				for (;i<nb;i++) { tab.push(Math.rand(tab[i-1],tab[i-1]+40)); }
				tab.push(100);
				return tab;
			default : return [0,100];
		}
	};
	
	window.inlineSVG = (function() { //source modernizr http://www.modernizr.com
		var div=document.createElement("div");
		div.innerHTML="<svg/>";
		return (div.firstChild && div.firstChild.namespaceURI) === "http://www.w3.org/2000/svg";
	})();
	
	if (!Object.defineProperty) {
	
		Object.defineProperty = function(elmt,name,obj) {
		
			if (obj.get && elmt.__defineGetter__) {
				elmt.__defineGetter__(name,obj.get);
			}
			if (obj.set && elmt.__defineSetter__) {
				elmt.__defineSetter__(name,obj.set);
			}
		};
	}

	for (var n in Methods) {
		if (window[n] && window[n].prototype) { customMethods(window[n].prototype,Methods[n]);}
	}
	
	for (n in Properties) {
		if (window[n] && window[n].prototype) { customProperties(window[n].prototype,Properties[n]);}
	}
			
})();