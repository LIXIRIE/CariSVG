/*
CariAnim, animation of SVG elements
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

	window.SVGElement.prototype.cariAnim = function(opt)
	{
		"use strict";
		
		if (this.anim) {
			if (opt) { this.anim.go(opt);}
			return this;
		}
	
		var svg = this.getSVG(),
		self = this;
		
		this.anim = {

			duration: 1000,
			step:20,
			callback:false,
			fct:false,
			counter : 0,
			inProgress : false,
			style : [0,100], //style linéaire par défaut
			originX : 'center',
			originY : 'center',
			loop : false,
			way : 1,
			
			from : false,
			to : false,
			
			queue : [], //file d'attente des animations
			indQueue:0,
			
			/////////////////////////////
			//usage privé
			decalage : false,
			
			animate : function() {
				this.goTo(this.counter);
				this.counter+= this.way * 100 * this.step / this.duration;
				this.counter = Math.min(100,Math.max(this.counter,0));
			},
			
			decomposeMtx : function(mtx) {
			
				return {
					scaleX : mtx.getScaleX(),
					scaleY : mtx.getScaleY(),
					rotate : mtx.getAngle(),
					translateX : mtx.getX(),
					translateY : mtx.getY()
				};
			},

			coef : function()
			{			
				var x = this.counter * (this.style.length-1) / 100,
				x1 = Math.min(Math.floor(x),this.style.length-2),
				x2 = x1+1,
				y1 = this.style[x1],
				y2 = this.style[x2],
				a = (y1-y2)/(x1-x2),
				b = y1 - a*x1;
				
				return Math.round(a*x+b);
			},
			////////////////////////////
					
			set : function(opt) {
			
				opt = opt || {};
				if (!opt.to) { opt = {to:opt}; }
				
				for (var n in opt) {
					if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
						this[n] = opt[n];
					}
				}
				
				this.decalage = self.getShift(this.originX,this.originY);
				
				if (!opt.from) {
						//l'état de début est l'état de fin de l'animation précédente
					if (this.queue.length > 0 && this.queue[this.indQueue-1]) { opt.from = this.queue[this.indQueue-1].to;}
					else {
						//si c'est la première il ne faut step prendre la matrice telle quelle
						// mais celle qui, après transformations, nous ramène à la matrice initiale.
						
						var mtx = self.getMtx(),
						inverse = mtx.inverse(),
						
						mtxTrans = svg.createSVGMatrix().translate(this.decalage.x,this.decalage.y)
						.scaleNonUniform(mtx.getScaleX(),mtx.getScaleY())
						.rotate(mtx.getAngle())
						.translate(-this.decalage.x,-this.decalage.y)
						.scaleNonUniform(inverse.getScaleX(),inverse.getScaleY())
						.rotate(inverse.getAngle())
						.inverse()
						.multiply(mtx);
						
						opt.from = this.decomposeMtx(mtxTrans);
					}
					this.from = opt.from;
				}
													//fonction globale car sert aussi aux animations SVG et courbes
				if (!(this.style instanceof Array)) { this.style = window.getTabFromAnimationStyle(this.style);}
				
				if (opt.to.constructor == SVGMatrix) {
					opt.to = this.decomposeMtx(opt.to);
				}
				else {						
					opt.to = {
						scaleX : (opt.to.scaleX!==undefined) ? opt.to.scaleX : ( opt.to.scale!==undefined ? opt.to.scale : this.from.scaleX),
						scaleY : (opt.to.scaleY!==undefined) ? opt.to.scaleY : ( opt.to.scale!==undefined ? opt.to.scale : this.from.scaleY),
						rotate : (opt.to.rotate!==undefined) ? opt.to.rotate : this.from.rotate,
						translateX :  (opt.to.translateX!==undefined) ? opt.to.translateX : this.from.translateX,
						translateY :  (opt.to.translateY!==undefined) ? opt.to.translateY : this.from.translateY
					};
				}
				
				this.to = opt.to;
										
				return this;
			},
			
			goTo : function(pourcentage) {
				
				pourcentage = Math.min(100,Math.max(pourcentage,0));
				this.counter = pourcentage;
				
				var coef = this.coef(),
				etat={},
				mtx,i,N,p,props = ['scaleX','scaleY','rotate','translateX','translateY'];
				
				for (i=0,N=props.length;i<N;i++){
					p = props[i];
					etat[p] = (this.from[p] * (100-coef) + this.to[p] * coef) /100 ;
				};
				
				mtx = svg.createSVGMatrix().translate(this.decalage.x,this.decalage.y)
				.translate(etat.translateX,etat.translateY)
				.rotate(etat.rotate)
				.scaleNonUniform(etat.scaleX,etat.scaleY)
				.translate(-this.decalage.x,-this.decalage.y);
																
				self.setMtx(mtx);
				
				if (this.fct) { this.fct.call(self); }
				
				if (pourcentage===100) {
											
					var inProgress = this.inProgress; 
					if (inProgress) { this.pause(); }
					
					if (this.callback) { this.callback.call(self); }
					
					if (this.queue[this.indQueue+1]) { //si file d'attente, on passe à l'animation suivante
						this.indQueue++;
						this.counter = 0;
						this.set(this.queue[this.indQueue]);
						if (inProgress) { this.play(); }
					}
					else if (this.loop) {
						this.stop();
						this.play();
					}
				}
				else if (pourcentage === 0 && !this.inProgress) {
					if (this.queue[this.indQueue-1]) { //si file d'attente, on passe à l'animation précédente
						this.indQueue--;
						this.counter = 100;
						this.set(this.queue[this.indQueue]);
					}
				}
										
				return this;
			},
			
			play : function() {
				if (!this.inProgress) { this.inProgress = window.setInterval(this.animate.bind(this),this.step); }
				return this;
			},
			
			pause : function() {
				window.clearInterval(this.inProgress);
				this.inProgress = false;
				return this;
			},
					
			stop : function() {
				this.pause();
				this.indQueue = this.counter = 0;
				if (this.queue[0]) { this.set(this.queue[0]); } //si plusieurs animations on remonte à la première
				this.goTo(0);
				return this;
			},
			
			clear : function() {
				this.pause();
				this.counter = this.indQueue = 0;
				this.queue = [];
				this.to = this.from = false;
				return this;
			},
			
			add : function(opt) {
				if (this.queue.length === 0) { this.set(opt); }
				this.queue.push(opt);
				return this;
			},
			
			go : function(opt) { //raccourci pour utilisation courante
				if (!this.inProgress) { this.clear(); }
				this.add(opt);
				if (!this.inProgress) {this.play();}
				return this;  
			}
		};
		
		if (opt) { this.anim.go(opt);}
		
		return this;
	};
}
