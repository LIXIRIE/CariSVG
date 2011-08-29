/*
CariSelect, make a mouse selection of svg elements
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
if (window.SVGSVGElement && window.SVGSVGElement.prototype) {

	window.SVGSVGElement.prototype.cariSelect = function(opt)
	{
		var svg = this;
		
		this.select = {

			id : 'selection',
			
			click : 'left',
			key : false,

			rect : false,

			className : 'selected',

			selected : [],
			selectedOld : [],
			deselected : [],

			callback : {
				selected : function() {},
				deselected : function() {}
			},

			list : [],
			
			start:false,
			drag:false,
			end:false,

			set : function(opt)
			{
				for (var n in opt) {
					if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
						this[n] = opt[n];
					}
				}
			},

			mousedown : function(e) {

				var self = this;
				
				var list = (typeof this.list == 'string') ? document.querySelectorAll(this.list) : this.list;
				
				//vérifie si la combinaison souris clavier est bonne
				var check = ((e.button==2 && this.click=='right') || (e.button!=2 && this.click=='left')) && (!this.key || e[this.key]);

				list.forEach(function(elmt) {
					elmt.classList.remove(self.className);
				});

				if (this.rect && this.rect.parentNode) { this.rect.remove(); }
				
				var remove = function() {
					
					if (self.rect && self.rect.parentNode) { self.rect.remove(); }
					
					list.forEach(function(elmt) {
						if (elmt.className === undefined) { return; }
						if (elmt.classList.contains(self.className)) { self.selected.push(elmt); }
						else if (self.selectedOld.indexOf(elmt)!==-1) { self.deselected.push(elmt); } 
					});

					self.callback.selected.call(self,self.selected);
					self.callback.deselected.call(self,self.deselected);

					self.selectedOld = self.selected;
					self.selected = [];
					self.deselected = [];
										
					if (self.end && check) { self.drag.call(self); }
				};
				
				if (check) {
				
					this.rect = svg.addElmt('rect',{
						id:this.id,
						x:0,y:0,
						width:1,
						height:1
					});
					
					var xy = svg.point(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
					
					this.rect.transf.translate(parseInt(xy.x,10),parseInt(xy.y,10));
					
					if (!this.rect.cariDrag)
					{
						alert('You must include the CariDrag module');
						return;
					}
					
					var mousemove = function(e) {
						
						var selection = self.rect.getBoundingClientRect();
						
						list.forEach(function(elmt) {
			
							var box = elmt.getBoundingClientRect();
									
							//si le chemin est inclus dans le frame de selection
							if (box.left >= selection.left && box.left+box.width <= selection.left+selection.width && box.top >= selection.top && box.top+box.height <= selection.top+selection.height) {
								if (!elmt.classList.contains(self.className)) { elmt.classList.add(self.className); }
							}
							else { elmt.classList.remove(self.className); };
						});
						
						if (self.drag) { self.drag.call(self); }
					};
				
					this.rect.cariDrag({
						resize:{
							click:this.click,
							key:this.key,
							keepRatio:false,
							originX:0,
							originY:0,
							xmin:0,
							ymin:0,
							inverse:true,
							start:this.start,
							end:remove,
							drag:mousemove
						},
						evt:e
					});
				}
				else { remove(); }
			},

			on : function(opt) {
				
				if (opt.callback && !opt.callback.selected) { opt.callback = { selected : opt.callback, deselected : function() {} }; }
				
				if (opt) { this.set(opt); }
				
				var mousedownFct = this.mousedown.bind(this);
				
				svg.addEventListener('mousedown',mousedownFct,false);
				if (this.click == 'right') { svg.addEventListener('contextmenu',function(e) {e.preventDefault();},false); }

				this.off = function() { svg.removeEventListener('mousedown',mousedownFct,false); return this;};
				
				return this;
			},

			off : function() {}
		};
		
		if (opt) { this.select.on(opt);}
		
		return this;
		
	};
}