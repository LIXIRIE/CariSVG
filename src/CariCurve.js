/*
CariCurve, manipulation of bezier curves
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
document.createCariCurve = function(opt)
{
	"use strict";
	//////////////////////////////////////////////////////////////////////
	// PRIVATE PROPERTIES
	
	var svg = document.createElementNS("http://www.w3.org/2000/svg","svg"),
	curveInProgress,
	g = svg.newElmt("g"),
	
	isClosed = function()
	{
		var pts = g.points.list, 
		N = pts.length;
		if (N<2){return false;}
		return (pts[0].x === pts[N-1].x && pts[0].y === pts[N-1].y) ? true : false;
	},
	
	array2path = function(tab)
	{	
		var i,j, path = 'M'+tab[0].x.toFixed(precision)+","+tab[0].y.toFixed(precision)+" ";
		
		if (tab.length < 3) {path+='L'+tab[1].x.toFixed(precision)+','+tab[1].y.toFixed(precision);}
		else {
			for(i=1;i<tab.length-2;i+=3){				
				path+="C";
				for (j=0;j<=2;j++){path+=tab[i+j].x.toFixed(precision)+','+tab[i+j].y.toFixed(precision)+' ';}
			}
		}
		
		return path;
	},
	
	path2array = function(opt)
	{
		opt = opt || {};
		var path = opt.path || g.path.getAttribute('d'),
		mtx = opt.mtx || false,
		ctrlPoints = opt.ctrlPoints || false,
		incr = ctrlPoints ? 2 : 6,
		pt, tabRetour = [],
		tab = path.trim().replace(/[A-Z] ?/g,'').split(/, *| /),
		i=0,N=tab.length;
		
		if (N <= 4) { incr = 2;} //cas particuliers des courbes à deux points (droites), pas de points de contrôle
		
		for (;i<N;i+=incr)
		{
			pt = svg.point(tab[i],tab[i+1]);
			if (mtx) { pt = pt.matrixTransform(mtx); }
			pt.x = pt.x;
			pt.y = pt.y;
			tabRetour.push(pt);
		}
		
		return tabRetour;
	},
		
	array2bez = function(pts)
	{
		var N = pts.length;
		if (N < 3) {return pts;}
		
		var tab = [],
		ferme = isClosed(),
		i=0,
		nm1,n0,np1,np2,x0,y0,x1,y1,x2,y2,x3,y3,
		tgx0,tgy0,tgx3,tgy3,dx,dy,d,dt0,dt3,ft0,ft3;
				
		// 1er point
		tab.push(pts[0]);
		
		//pour chaque point
		for (;i<N-1;i++)
		{	
			// on a besoin du point précédent et des 2 suivants
			nm1 = i-1;  n0 = i;  np1 = i+1;  np2 = i+2;
		
			// extremités
			if (n0 === 0) { nm1 = ferme ? N-2 : n0; }
			else if (n0 === N-2) { np2 = ferme ? 1 : np1; }
						
			x0 = pts[n0].x;  y0 = pts[n0].y;
			x3 = pts[np1].x;	y3 = pts[np1].y;
			
			tgx3 = x0 - pts[np2].x;
			tgy3 = y0 - pts[np2].y;
			tgx0 = pts[nm1].x - pts[np1].x;
			tgy0 = pts[nm1].y - pts[np1].y;
			dx  = Math.abs(x0 - x3);
			dy  = Math.abs(y0 - y3);
			d   = Math.sqrt(dx*dx + dy*dy);
			dt3 = Math.sqrt(tgx3*tgx3 + tgy3*tgy3);
			dt0 = Math.sqrt(tgx0*tgx0 + tgy0*tgy0);
			
			if (d !== 0)
			{
				ft3 = (dt3 / d) * 3;
				ft0 = (dt0 / d) * 3;
				
				x1 = x0 - tgx0 / ft0;
				y1 = y0 - tgy0 / ft0;
				x2 = x3 + tgx3 / ft3;
				y2 = y3 + tgy3 / ft3;
				
				tab.push( svg.point(x1,y1) , svg.point(x2,y2) , svg.point(x3,y3) );
			}
		}
				
		return tab;
	},
	
	casteljau = function(pts) {
	
		var i,p1,p2,c1,c2,m1,m2,m3,mm1,mm2,mmm,tab = [],
		N = pts.length-1;
					
		for(i=0;i<N;i+=3)
		{
			p1 = pts[i];
			c1 = pts[i+1];
			c2 = pts[i+2];
			p2 = pts[i+3];

			m1 = svg.point((p1.x+c1.x)/2, (p1.y+c1.y)/2);
			m2 = svg.point((c1.x+c2.x)/2, (c1.y+c2.y)/2);
			m3 = svg.point((c2.x+p2.x)/2, (c2.y+p2.y)/2);
			
			mm1 = svg.point((m1.x+m2.x)/2, (m1.y+m2.y)/2);
			mm2 = svg.point((m2.x+m3.x)/2, (m2.y+m3.y)/2);
			mmm = svg.point((mm1.x+mm2.x)/2, (mm1.y+mm2.y)/2);
			
			if (i===0) {tab.push(p1);}
			tab.push(m1,mm1,mmm,mm2,m3,p2);
		}		
		
		return tab;
	},
	
	applyPath = function()
	{	
		var bezier = array2bez(g.points.list),
		path = array2path(bezier);
				
		g.path.setAttribute('d',path);
		if (g.extraPoints.display) {g.extraPoints.show();}
		if (g.pattern.display) {g.pattern.show();}
		if (g.textPath.path && g.path.id) { g.textPath.path.link.set('#'+g.path.id); }
	},
		
	mainPoint = function(x,y)
	{
		this.x = parseFloat(this.getAttribute('cx'));
		this.y = parseFloat(this.getAttribute('cy'));
		
		var pts = g.points.list,
		_this = this;		
		
		if (isClosed() && pts.length > 3)
		{
			if (g.points.magnet.className) { pts[0].setAttribute("class",g.points.magnet.className); }
			pts[0].setAttribute("r",g.points.radius+2);
		}
						
		this.move = function(e)
		{	
			e.stopPropagation();
						
			var pt = svg.point(e.clientX,e.clientY).matrixTransform(g.getScreenCTM().inverse()),
			ptp = pts[0],
			ptd = pts[pts.length-1];

			// courbes fermées : si on bouge le premier point on bouge aussi le dernier
			if (isClosed() && _this === ptd && pts.length > 3 && !curveInProgress)
			{
				ptp.setAttribute("cx",pt.x); ptp.x = pt.x;
				ptp.setAttribute("cy",pt.y); ptp.y = pt.y;
				ptd.setAttribute("cx",pt.x); ptd.x = pt.x;
				ptd.setAttribute("cy",pt.y); ptd.y = pt.y;

				applyPath();
				return;
			}
			
			var ref = (_this === ptp) ? ptd : ptp;
			
			// aimantation
			if (g.points.magnet.strength) {
				if (Math.abs(ref.x-pt.x) < g.points.magnet.strength && Math.abs(ref.y-pt.y)< g.points.magnet.strength && pts.length > 3)
				{	
					_this.setAttribute("cx",ref.x); _this.x = ref.x;
					_this.setAttribute("cy",ref.y); _this.y = ref.y;
												
					pts[0].setAttribute("class",g.points.magnet.className);
					pts[0].setAttribute("r",g.points.radius+2);
					
					applyPath();
					return;
				}
			}
									
			_this.setAttribute("cx",pt.x); _this.x = pt.x;
			_this.setAttribute("cy",pt.y); _this.y = pt.y;
			
			if (!isClosed())
			{				
				pts[0].setAttribute("class",'');
				pts[0].setAttribute("r",g.points.radius);
			}
			
			applyPath();
			
			if (g.points.drag) { g.points.drag.call(_this,e); }
		};
		
		this.suppress = function()
		{
			pts.remove(_this);
			_this.remove();
		};
		
		this.addEventListener('click',function(e) {if (e.button!==2) {e.stopPropagation();}},false); //utile pour la gomme
		
		this.addEventListener('mousedown',function(e) {
			
			if (e.button===2) {return;} //click left seulement
			e.preventDefault();
			e.stopPropagation();
				
			window.addEventListener('mousemove',_this.move,false);
			window.addEventListener('mouseup',function remove(e) {
				window.removeEventListener('mousemove',_this.move,false);
				window.removeEventListener('mouseup',remove,false);
				if (g.points.end) { g.points.end.call(_this,e); }
			},false);
			
			if (g.points.start) { g.points.start.call(_this,e); }
			
		},false);
	};
	
	//////////////////////////////////////////////////////////
	//PUBLIC PROPERTIES
	
	
	
	//////////////////////////////////////////////////////////
	//PRECISION
	var precision = 2;
	Object.defineProperty(g, "precision", {
		get : function() { return precision; },
		set : function(value) {
			if (typeof value !== 'number') { throw(value+" is not a number");}
			precision = parseInt(Math.max(0,value),10);
			if (this.parentNode) { this.autoDraw(this.points.get()); }
		}
	});
	
	
	//////////////////////////////////////////////////////////
	//OBJET POINTS
	g.points = {
				
		list : [],

		nbmin : false,// nombre de points minimal pour définir la courbe (utile pour multiplier ou diviser le nb de points)

		magnet : { strength : 5 },
			
		get : function(opt){
			
			opt = opt || {};
			
			return path2array({
				mtx : opt.realXY ? false : g.getMtx(),
				ctrlPoints: opt.ctrlPoints
			});
		},
		
		multiply : function(nb)
		{
			if (nb!==undefined) {
				for (var i=0;i<nb;i++){ this.multiply(); }
				return this;
			}
			
			var nbmin = this.nbmin,
			pts = path2array({ctrlPoints:true});
			g.autoDraw({points:casteljau(pts),ctrlPoints:true,mtx:g.getAttribute('transform')});
			this.nbmin = nbmin;
			return this;
		},
		
		divide : function(nb)
		{
			if (this.nbmin === this.list.length) { return this;}
			
			var i,N,nbmin = this.nbmin,
			pts = [];
			
			if (nb!==undefined) {
				for (i=0;i<nb;i++){ this.divide(); }
				return this;
			}
			
			for (i=0,N=this.list.length;i<N;i+=2) { pts.push(this.list[i]); }
			
			g.autoDraw({points:pts,mtx:g.getAttribute('transform')});
			this.nbmin = nbmin;
			return this;
		},
		
		inverse : function() {
			g.autoDraw({points:path2array().reverse(),mtx:g.getAttribute('transform')});
			return this;
		}
	};
	
	var radiusPoints = 3;
	Object.defineProperty(g.points, "radius", {
		get : function() { return radiusPoints; },
		set : function(value) {
			if (typeof value !== 'number') { throw(value+" is not a number");}
			radiusPoints = parseInt(Math.max(0,value),10);
			this.list.forEach(function(node) {
				if (node.getAttribute) { node.attr('r',value) }
			});
		}
	});
	
	var displayPoints = true;
	Object.defineProperty(g.points, "display", {
		get : function() { return displayPoints; },
		set : function(value) {
			if (typeof value !== 'boolean') { throw(value+" is not a boolean");}
			if (value && !displayPoints) {
				var _this = this;
				this.list.forEach(function(pt,ind) {
					pt = svg.newElmt("circle",{"cx":pt.x.toFixed(precision),"cy":pt.y.toFixed(precision),"r":g.points.radius});
					g.appendChild(pt);
					mainPoint.call(pt);
					_this.list[ind] = pt;
				});
			}
			else if (!value && displayPoints) {
				this.list.forEach(function(node,ind) {
					this.list[ind] = svg.point(parseFloat(node.attr('x')),parseFloat(node.attr('y')));
					node.remove();
				})
			}	
			displayPoints = value;
		}
	});
	
	var classClosingPoint = 'closingPoint';
	Object.defineProperty(g.points.magnet, "className", {
		get : function() { return classClosingPoint; },
		set : function(value) {
			if (typeof value !== 'string') { throw(value+" is not a string");}
			if (isClosed()) {
				g.points.list[0].classList.remove(classClosingPoint);
				g.points.list[0].classList.add(value);
			}
			classClosingPoint = value;
		}
	});
	
	//////////////////////////////////////////////////////////
	//OBJET EXTRAPOINTS points de la courbe non significatifs
	g.extraPoints = { 
				
		nb:1, //2^nb points
		list:[],
		
		set : function(opt) {
			for (var n in opt) {
				if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
					this[n] = opt[n];
				}
			}
		},
		
		multiply : function(nb) {
			this.nb+= (nb!==undefined) ? nb : 1;
			if (this.display) { this.show(); }
		},
		
		divide : function(nb) {
			this.nb-= (nb!==undefined && this.nb-nb >=0) ? nb : 0;
			if (this.display) { this.show(); }
		},
		
		hide : function()
		{
			while(this.list[0]) {this.list[0].remove(); this.list.shift();}
		},
		
		show : function()
		{							
			if (g.points.list.length < 3) { return; }
			
			this.hide();
			
			var modulo = Math.pow(2,this.nb) * 3,
			pts = path2array({ctrlPoints:true}),
			pt,i,x,y,N;
			
			i=0;
			while (i<this.nb) { pts = casteljau(pts); i++;}
			
			for (i=0,N=pts.length;i<N;i+=3)
			{
				if (i % modulo === 0) { continue; }
				
				x = pts[i].x.toFixed(precision);
				y = pts[i].y.toFixed(precision);
				
				pt = svg.newElmt("circle", {"cx":x,"cy":y,"r":this.radius,"class":this.className} );
				g.appendChild(pt);
				this.list.push(pt);
			}
		}
	};
	
	var radiusExtraPoints = 2;
	Object.defineProperty(g.extraPoints, "radius", {
		get : function() { return radiusExtraPoints; },
		set : function(value) {
			if (typeof value !== 'number') { throw(value+" is not a number");}
			radiusExtraPoints = parseInt(Math.max(0,value),10);
			this.list.forEach(function(node) {
				if (node.getAttribute) { node.attr('r',value) }
			});
		}
	});
	
	var classNameExtraPoints = "extraPoint";
	Object.defineProperty(g.extraPoints, "className", {
		get : function() { return classNameExtraPoints; },
		set : function(className) {
			if (typeof className !== 'string') { throw(className+" is not a string");}
			classNameExtraPoints = className;
			this.list.forEach(function(node) {
				if (node.getAttribute) { node.classList.add(className); }
			});
		}
	});
	
	var displayExtraPoints = false;
	Object.defineProperty(g.extraPoints, "display", {
		get : function() { return displayExtraPoints; },
		set : function(value) {
			if (typeof value !== 'boolean') { throw(value+" is not a boolean");}
			if (value && !displayExtraPoints) { this.show(); }
			else if (!value && displayExtraPoints) { this.hide(); }
			displayExtraPoints = value;
		}
	});
	
	
	//////////////////////////////////////////////////////////
	//OBJET PATTERN
	g.pattern = {
			
		nb : 1,
		id : false,
		extremities : true,
		list:[],
		
		set : function(opt) {
			for (var n in opt) {
				if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
					this[n] = opt[n];
				}
			}
		},
		
		multiply : function(nb) {
			this.nb+= (nb!==undefined) ? nb : 1;
			if (this.display) { this.show(); }
		},
		
		divide : function(nb) {
			this.nb-= (nb!==undefined && this.nb-nb >=0) ? nb : 0;
			if (this.display) { this.show(); }
		},
		
		hide : function() {
			while(this.list[0]) {this.list[0].remove(); this.list.shift();}
		},
		
		show : function() {
				
			if (g.points.list.length < 3) { return; }
			
			this.hide();
			
			var pts = path2array({ctrlPoints:true}),
			pt,i,x,y,N,ind,angle;
			
			i=0;
			while (i<this.nb-1) { pts = casteljau(pts); i++;}
			
			for (i=0,N=pts.length;i<N;i+=3)
			{
				if (!this.extremities && (i===0 || i===N-1)) {continue;}
				x = pts[i].x.toFixed(precision);
				y = pts[i].y.toFixed(precision);
				
				pt = svg.newElmt("use", {"x":x,"y":y});
				g.insertBefore(pt,g.path.nextSibling);
				pt.link.set(this.id);
				this.list.push(pt);
				ind = i + (i<N-1 ? 1 : -1);
				angle =  90 - Math.atan2(pts[ind].x - pts[i].x,pts[ind].y - pts[i].y) * 180 / Math.PI;
				if (i === N-1) { angle+=180;}
				pt.transf.rotate(angle , pts[i].x , pts[i].y);
			}
		}
	};
	
	var displayPattern = false;
	Object.defineProperty(g.pattern, "display", {
		get : function() { return displayPattern; },
		set : function(value) {
			if (typeof value !== 'boolean') { throw(value+" is not a boolean");}
			if (value && !displayPattern) { this.show(); }
			else if (!value && displayPattern) { this.hide(); }
			displayPattern = value;
		}
	});
	
	var idPattern = false;
	Object.defineProperty(g.pattern, "id", {
		get : function() { return idPattern; },
		set : function(value) {
			if (typeof value !== 'string') { throw(value+" is not a string");}
			this.list.forEach(function(pt) { pt.link.set(value); });
			idPattern = value;
		}
	});
	
	var extremitiesPattern = true;
	Object.defineProperty(g.pattern, "extremities", {
		get : function() { return extremitiesPattern; },
		set : function(value) {
			if (typeof value !== 'boolean') { throw(value+" is not a boolean");}
			extremitiesPattern = value;
			if (this.display) { this.show(); }
		}
	});
	

	
	var publicProperties = {

		path : g.appendChild(svg.newElmt('path')),
		
		set : function(opt,cible) // fonction pour définir les options
		{
			cible = cible || this;
			for (var n in opt) {
				if (opt.hasOwnProperty(n)) {
					if (typeof opt[n] == 'object' && opt[n]!==null && !(opt[n] instanceof Array)) { this.set(opt[n],cible[n]); }
					else if (cible.hasOwnProperty(n)) { cible[n] = opt[n]; }
				}
			}
			
			return cible;
		},
		
		textPath : {
			
			node : null,
			path : null,
			options : {startOffset:0,method:'stretch',spacing:'auto'},
			
			create : function() {
				if (!g.path.id) { g.path.id = 'curve'+Math.rand(0,1000); }
				
				this.node = svg.newElmt('text');
				g.insertBefore(this.node,g.firstChild);
				this.path = this.node.addElmt('textPath',this.options).link.set('#'+g.path.id).text.add('');
			},
		
			add : function(str,options) {
				if (!this.node) {
					if (options) { this.options = options; }
					this.create();
				}
				this.path.text.add(str);
				return this;
			},
			
			change : function(str) {
				if (!this.node) {this.create();}
				this.path.text.change(str);
				return this;
			},
			
			get : function() {
				return this.path && this.path.text.get();
			},
			
			remove : function() {
				if (this.node) {
					this.node.remove();
					this.node = null;
					this.path = null;
				}
			}
		},
		
		
		
		
		draw : function(arg)
		{
			if (arg.parent) { arg.parent.appendChild(g); }
			if (!g.parentNode) { alert('You must append the CariCurve to the DOM first'); return; }
			if (g.points.display === false) { g.points.display = true; }
			
			var e = arg.event || arg,
			callback = arg.callback || false,
			fctClick, pt={},
			area = g.parentNode,
			svg = g.getSVG(),
			
			addPoint = function(e) {
				
				if (pt.move) {svg.removeEventListener('mousemove',pt.move,false); }
				
				var xy = svg.point(e.clientX,e.clientY).matrixTransform(area.getScreenCTM().inverse());
				pt = svg.newElmt("circle",{"cx":xy.x.toFixed(precision),"cy":xy.y.toFixed(precision),"r":g.points.radius});
				g.appendChild(pt);
				g.points.list.push(pt);
				mainPoint.call(pt);
				svg.addEventListener('mousemove',pt.move,false);
			},
			
			endCurve = function()
			{
				svg.removeEventListener('mousemove',pt.move,false);
				area.removeEventListener('click',fctClick,true);		
				curveInProgress = false;
				g.points.nbmin = g.points.list.length;
				if (callback) {callback();}
			};
			
			fctClick = function(e)
			{
				if (curveInProgress === false) { return; }
				if (isClosed()) { //si on clique sur le premier point, on ferme la courbe et on termine 
					if (g.points.list.length>2) {endCurve();} //sauf si on a que 2 points confondus
				}
				else if (e.detail === 2 && g.points.list.length >= 3) //double-click sur le dernier point, on termine la courbe, mais il faut retirer le dernier point (evt simple click)
				{
					g.points.list[g.points.list.length-1].remove();
					g.points.list.pop(); //on retire le point
					endCurve();
				}
				else {addPoint(e);}
			};
			
			curveInProgress = true;
			
			//2 premiers points
			addPoint(e);
			addPoint(e);
			
			applyPath();
			
			area.addEventListener('click',fctClick,true);
		},
		
		autoDraw : function(opt)
		{
			if(typeof opt === 'string') {opt={path:opt};}
			else if (opt instanceof Array) { opt={points:opt};}

			var path = opt.path || false, //on passe en argument soit un chemin
			pts = opt.points || false, // soit un tableau d'objets points
			ctrlPoints = opt.ctrlPoints || false, //si tableau, on précise s'il contient les points de contrôles ou non
			mtx = opt.mtx || false, //matrice de transformation à appliquer
			incr = ctrlPoints ? 3 : 1,
			pt,i,N;
					
			if (path && !pts) { pts = path2array({path:path,ctrlPoints:ctrlPoints}); } //tableau des points sans les points de contrôles
					
			if (pts.length < 3) { incr = 1;} //cas particuliers des courbes à deux points (droites), step de points de contrôle
			
			this.reset();
			
			for (i=0,N=pts.length;i<N;i+=incr)
			{
				if (this.points.display) { pt = svg.newElmt("circle",{"cx":pts[i].x,"cy":pts[i].y,"r":this.points.radius}); }
				else { pt = svg.point(pts[i].x,pts[i].y); }
				
				this.points.list.push(pt);
				
				if (this.points.display) {
					g.appendChild(pt);
					mainPoint.call(pt);
				}
			}
				
			this.points.nbmin = this.points.list.length;
										
			applyPath();
			
			if (mtx) {g.setAttribute('transform',mtx);}
		},
		
		random : function(nbp,xmin,xmax,ymin,ymax) {
			
			var nbp = nbp || 4,
			area = g.parentNode || false,
			tag = area && area.tagName.toLowerCase();
			
			if (area === false && (xmax === undefined || ymax === undefined)) {
				alert('You must append the CariCurve to the DOM or specify the xmin,xmax,ymin,ymax'); return false;
			}
			
			xmin = xmin || 0;
			xmax = xmax || (tag === 'svg' ? area.cssInt('width') : area.getBBox().width );
			ymin = ymin || 0;
			ymax = ymax || (tag === 'svg' ? area.cssInt('height') : area.getBBox().height );
			
			var i=0,tab = [];
			for (;i<nbp;i++) { tab.push({x:Math.rand(xmin,xmax),y:Math.rand(ymin,ymax)}); }

			return tab;
		},
		
		animPath : {
		
			duration: 1000,
			step: 20,
			callback:false,
			counter : 0,
			from : false,
			to : false,
			inProgress : false,
			style : [0,100], //style linéaire par défaut
			loop : false,
			way : 1,
			fct : false,
			
			queue : [], //file d'attente des animations		
			indQueue:0,
			
			/////////////////////////////
			//usage privé
			ratio : false,
			animate : function() {
					
				this.goTo(this.counter);
				this.counter+= this.way * 100 * this.step / this.duration;
				this.counter = Math.min(100,Math.max(this.counter,0));
			},
			
			coef : function() {
				
				//interpolation linéaire entre deux valeurs du tableau easing
				var x = this.counter * (this.style.length-1) / 100,
				x1 = Math.min(Math.floor(x),this.style.length-2), x2 = x1+1,
				y1 = this.style[x1], y2 = this.style[x2],
				a = (y1-y2)/(x1-x2), b = y1 - a*x1;
				return Math.round(a*x+b);
			},
			////////////////////////////
					
			set : function(opt) {
			
				if (typeof opt !== 'object' || opt instanceof Array) { opt = {to:opt}; }
				if (typeof opt.to === 'string') { opt.to = path2array({path:opt.to}); }
				
				for (var n in opt) {
					if (opt.hasOwnProperty(n) && this.hasOwnProperty(n)) {
						this[n] = opt[n];
					}
				}
				
				//fonction globale car sert aussi aux animations SVG et courbes
				if (!(this.style instanceof Array)) { this.style = window.getTabFromAnimationStyle(this.style);}
							
				var nbDeb,nbFin = this.to.length;
				
				if (!opt.from) {
					opt.from = g.points.get({ctrlPoints:false});
					this.from = opt.from;
				}
							
				//il faut toujours avoir plus de points au départ qu'à l'arrivée
				
				while ((nbDeb = this.from.length) && nbDeb < nbFin) {
					g.points.multiply();
					this.from = g.points.get({ctrlPoints:false});
				}
				
				this.ratio = nbFin / nbDeb;
				
				return this;
			},
			
			goTo : function(pourcentage) {
				
				pourcentage = Math.min(100,Math.max(pourcentage,0));
				this.counter = pourcentage;
				
				var j,x,y,tab=[],pourcent,prec;
							
				pourcent = this.coef();
				
				for (j=0;j<this.from.length;j++)
				{
					x = (this.from[j].x * (100-pourcent) + this.to[ Math.floor(this.ratio * j) ].x * pourcent)/ 100;
					y = (this.from[j].y * (100-pourcent) + this.to[ Math.floor(this.ratio * j) ].y * pourcent)/100;
					
					if (tab.length > 0 && x==tab[tab.length-1].x && y==tab[tab.length-1].y) { continue; }//rassemble les doublons
					
					tab.push(svg.point(x,y));
				}
									// point de départ et d'arrivée, on affiche les points pivots
				g.autoDraw({points:tab,displayPoints: (this.counter % 100 === 0 && g.points.display) ? true : false});
				
				if (this.fct) { this.fct.call(g); }

				if (pourcentage===100) {
					
					var inProgress = this.inProgress; 
					if (inProgress) { this.pause(); }
					
					if (this.callback) { this.callback.call(g); }
					
					if (this.queue[this.indQueue+1]) { //si file d'attente, on passe à l'animation suivante
						this.indQueue++;
						this.counter = 0;
						this.queue[this.indQueue].from = g.points.get({ctrlPoints:false});
						this.set(this.queue[this.indQueue]);
						if (inProgress) { this.play(); }
					}
					else if (this.loop) {
						this.stop();
						if (inProgress) { this.play(); }
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
				if (this.inProgress) {window.clearInterval(this.inProgress);}
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
				this.to = [];
				this.from = [];
				this.ratio = this.callback = false;
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
		},
		
		reset : function()
		{
			this.path.setAttribute('d','M0,0');
			g.setAttribute('transform','matrix(1,0,0,1,0,0)');
			
			var pt;
			while ((pt = this.points.list[0])) {
				if (pt.suppress) { pt.suppress();} //il s'agit d'un point pivot
				else {this.points.list.remove(pt);} // il s'agit juste d'un point repère
			}
			this.points.nbmin = false;
		},
		
		remove : function() {
			this.reset(); this.animPath.clear(); return g.parentNode && g.parentNode.removeChild(g);
		}
	};
	
	
	for (var n in publicProperties) {
		if (publicProperties.hasOwnProperty(n)) {
			g[n] = publicProperties[n];
		}
	}
	
	if (opt) { g.set(opt);}
	
	return g;
	
};