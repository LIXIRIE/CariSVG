/*
CariTextAnim, animation of Text elements
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
if (window.SVGTextElement && window.SVGTextElement.prototype) {

	window.SVGTextElement.prototype.cariTextAnim = function(opt)
	{
		"use strict";

		if (!this.cariAnim) {
			alert('You must include the CariAnim module');
			return;
		}
		
		if (this.textAnim) {
			if (opt) { this.textAnim.show(opt); }
			return;
		}
	
		var svg = this.getSVG(),
		str = this.firstChild.nodeValue,
		timers = [],
		letters = [],
		self = this,
		
		createLetter = function(caractere,ind) {
		
			var box,	
			newLetter = self.cloneNode(true);
			
			newLetter.css('visibility','hidden');
			newLetter.text.change(caractere);
			
			self.parentNode.appendChild(newLetter);
			var wordtest = self.cloneNode(true);
			wordtest.css('visibility','hidden');
			wordtest.text.change(str.substr(0,ind).replace(/ /g,'o'));
			svg.appendChild(wordtest);
			var width = wordtest.getBBox().width;
			wordtest.remove();
			
			newLetter.setAttribute('x',parseInt(newLetter.getAttribute('x'),10)+width);
		
			letters[ind] = newLetter;
		};

		
		this.textAnim = {
		
			letters : letters,
			
			set : function(opt)
			{
				if (opt && !opt.from) { opt = {from:opt}; }
				opt = opt || {};
				
				for (var n in opt) {
					if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
						this[n] = opt[n];
					}
				}
				
				str = self.firstChild.nodeValue;
								
				var mtx = self.getMtx();
				
				this.to = {
					scaleX : mtx.getScaleX(),
					scaleY : mtx.getScaleY(),
					rotate : mtx.getAngle(),
					translateX : mtx.getX(),
					translateY : mtx.getY()
				};
			},
						
			from : {
				scale:10,
				scaleX:1,
				scaleY:1,
				rotate:0,
				translateX:0,
				translateY:0
			},
			
			to : false,

			delay : 300,
			duration : 300,
			style : 'swing',
						
			callback : false,
			callbackLetter : false,
			
			showLetter : function(letter,ind) {
			
				var _this = this;
				
				letter.transf.translate(this.from.translateX || 0,this.from.translateY || 0)
				.scale(this.from.scale || 1)
				.scaleNonUniform(this.from.scaleX || 1, this.from.scaleY || 1)
				.rotate(this.from.rotate || 0);
				
				letter.css('visibility','visible');

				letter.cariAnim({
					to:this.to,
					duration:this.duration,
					style:this.style,
					callback: function() {
						if (_this.callbackLetter) { _this.callbackLetter.call(self,letter); }
						if (ind && ind === letters.length-1 && _this.callback) { _this.callback.call(self); }
					}
				});
			},
			
			hideLetter : function(letter,ind) {
				var _this = this;
				letter.transf.translate(this.to.translateX || 0,this.to.translateY || 0).scale(this.to.scale || 1).rotate(this.to.rotate || 0);
				letter.css('visibility','visible');
				letter.cariAnim({
					to:this.from,
					duration:this.duration,
					style:this.style,
					callback: function() {
						letter.remove();
						letters.remove(letter);
						if (ind!==undefined && ind === 0 && _this.callback) { _this.callback.call(self); }
					}
				});
			},
		
			show : function(opt) {
			
				this.clear();
				this.set(opt);
							
				var cpt = 0,
				_this = this;
				
				self.css('visibility','hidden');
				str.forEach(createLetter);
				
				letters.forEach(function(letter,ind) {
					letter.css('visibility','hidden');
					timers.push(window.setTimeout(function() { _this.showLetter(letter,ind); },cpt));
					cpt+=_this.delay;
				});
				
				return this;
			},
			
			hide : function(opt) {
			
				this.clear();
				this.set(opt);
							
				var cpt = 0,
				_this = this;
				
				self.css('visibility','hidden');
				str.forEach(createLetter);
				
				letters.reverse().forEach(function(letter,ind) {
					letter.css('visibility','visible');
					timers.push(window.setTimeout(function() { _this.hideLetter(letter,ind); },cpt));
					cpt+=_this.delay;
				});
				
				return this;
			},
						
			clear : function() {
				
				timers.forEach(function(timer) { window.clearTimeout(timer); });
				timers = [];
				letters.forEach(function(letter) {letter.remove();});
				letters = [];
				self.css('visibility','visible');
				return this;
			},
			
			change : function(newstr,opt) {
			
				if (newstr === str) { return; }
				
				this.clear();
				this.set(opt);
				str.forEach(createLetter);
				
				self.css('visibility','hidden');
				self.text.change(newstr);
								
				var letter,
				oldstr = str,
				cpt = 0,
				redraw = false,
				_this = this;
				
				while (newstr.length < str.length){
					letter = letters[str.length-1];
					//this.hideLetter(letter);
					letter.remove();
					letters.remove(letter);
					str = str.substr(0,str.length-1);
				}
				
				str = newstr;
		
				newstr.forEach(function(caractere,ind) {
					if (oldstr[ind]===undefined || caractere!=oldstr[ind]) {
						if (oldstr[ind]!==undefined) {letters[ind].remove();}
						createLetter(caractere,ind);
						timers.push(window.setTimeout(function() {_this.showLetter(letters[ind]);},cpt));
						cpt+=_this.delay;
						redraw = true; //il y a eu un changement, il faut repositionner les caractères suivants même s'ils sont identiques
					} else {
						if (redraw){
							letters[ind].remove();
							createLetter(caractere,ind);
						}	
						letters[ind].css('visibility','visible');
					}
				});
				
				return this;
			}
		};
		
		if (opt) { this.textAnim.show(opt); }
		
		return this;
	};
}