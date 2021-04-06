  var LRButton = {

    left : 1,
    right : 2
};

//function CCarousel(id,chunkSize) {
const CLS_MAIN_CONTAINER = "main-container";
const CLS_SLIDE_CONTAINER = "slide-container";
const CLS_CAROUSEL = "carousel";
const CLS_SLIDE = "slide";
const CLS_TITLE_BAR = "title-bar"

const CHUNK_COUNT = 6;
//change this to chose how many slide scroll to left or rigth
const SCROLL_COUNT = 6; 
const IMG_NOT_FOUND = "notfound.gif";
const IMG_WAIT = "wait.gif";
const DIR_CAROUSEL_SOURCE = 'images/';
// URL use for request
const URL_REQUEST = "http://localhost/FrontEndTest/api.php";
const TIMEOUT_SECONDS = 2; 

String.prototype.toHRTime = function() {
		
	return parseInt(this,10).toHRTime();
}

Number.prototype.toHRTime = function() {
	const SEC_IN_HOUR = 60 * 60;
	const SEC_IN_MINUTE = 60;
	
	let seconds = this;
	let hours = Math.floor(seconds / SEC_IN_HOUR);
	let minutes = Math.floor( ( ( seconds - ( hours * SEC_IN_HOUR ) ) / SEC_IN_MINUTE ) );
	seconds -=  ( ( hours * SEC_IN_HOUR ) + ( minutes * SEC_IN_MINUTE ) );
	
	result = hours + "h:"+ ( (minutes >=10) ? minutes : "0"+minutes ) + "m:" + ( (seconds >= 10) ? seconds : "0"+seconds) + "s";
	
	return result; 
}


class CCarousel {
	
	
	constructor(args){
		
		
		this.args = Object.create(args);
				
		//first time we need images, use to indicate if there are more images to load
		this.needImages = true;
									
		this.chunkCount = CHUNK_COUNT;
		this.carousel = document.querySelector(this.args.container);		
				
		this.mainContainer = this.makeContainer(CLS_MAIN_CONTAINER);
		this.carousel.appendChild(this.mainContainer);
		
		this.titleBar = this.makeTitleBar(CLS_TITLE_BAR,this.args.title,this.args.subtitle);
		this.mainContainer.appendChild(this.titleBar);
		
		this.leftButton = this.makeButton(LRButton.left);
		//window.attachEvent in alternativa per browser diversi
		this.leftButton.addEventListener("click",this.leftBtnOnClick.bind(this),false);
		//this.mainContainer.appendChild(this.leftButton);	
		
		this.slideContainer = this.makeSlideContainer(CLS_SLIDE_CONTAINER, CLS_CAROUSEL);
		
		this.slideContainer.appendChild(this.leftButton);
		
		this.mainContainer.appendChild(this.slideContainer);
				
		this.rightButton = this.makeButton(LRButton.right);
		//window.attachEvent in alternativa per browser diversi
		this.rightButton.addEventListener("click",this.rightBtnOnClick.bind(this),false);
		//this.mainContainer.appendChild(this.rightButton);
		this.slideContainer.appendChild(this.rightButton);

		//make room for firs item's chunk				
		this.cacheItems = new Array(this.chunkCount);
			
		this.carousel = this.carousel.querySelector("ul."+CLS_CAROUSEL);
		this.slides = this.carousel.querySelectorAll('li.'+CLS_SLIDE);
		

		this.queryImagesChunk(0).then(function(){

			this.redraw(0);			
			this.toggleButtonVisibility(this.rightButton,this.hasMore);
			

		}.bind(this),

		function(){
			alert("Unable to load images")
		})
		
		window.addEventListener('resize', function(event){
			
			event.preventDefault();
			this._slideWidth = null;
			this._slideContainerWidth = null;
			this.slides = this.carousel.querySelectorAll('li.'+CLS_SLIDE); 
			
			let visibleIndex  = ( ( this.currentIndex ) )
			this.redraw(visibleIndex);

		}.bind(this));
		

				
	}

	get hasMore() {
			
		if ( (this.slides != undefined) && (this.slides.length > 0) ) {
			
			let lastIndex = this.slides.length - 1;
			
			if ( ( this.slides[lastIndex].style.left != "" ) && ( this.slides[lastIndex].style.left != undefined ) ) {
				
				let y = Math.floor(this.pixelSizeToInt( this.slides[lastIndex].style.getPropertyValue('left') ));
				let w = Math.floor(this.slideContainerWidth);
				let sw = Math.floor(this.slideWidth);

				return ( ( this.needImages ) || ( ( y + sw ) > w ) )
				
				
				 
													
			} else {
				return false;
			}
		} else {
			return false;
		}
	}	
	
	get hasLess() {
		
		if ( (this.slides != undefined) && (this.slides.length > 0) ) {

			if ( ( this.slides[0].style.left != "" ) && ( this.slides[0].style.left != undefined ) ) {

				let y = this.pixelSizeToInt( this.slides[0].style.getPropertyValue('left') );

				return y < 0;
				
			} else {
				return false;
			}
		} else {
			return false;
		}
		
	}
			

	get slideContainerWidth(){
		
		if ( this._slideContainerWidth == undefined ){
			if ( this.slideContainer != undefined ){
				this._slideContainerWidth = this.slideContainer.getBoundingClientRect().width;				
			}
		}
		
		return ( this._slideContainerWidth  == null) ? 0 : this._slideContainerWidth;		
	}	
	
	get slideWidth() {
		// cached until next resize
		if ( this._slideWidth == undefined ) {		
			if ( (this.slides != undefined) && (this.slides.length > 0) ) {
				this._slideWidth = this.slides[0].getBoundingClientRect().width
			} else {
				let x = this.carousel.querySelectorAll('li.'+CLS_SLIDE);
				if ( ( x != undefined ) && ( x.length > 0 ) ){
					this._slideWidth = x[0].getBoundingClientRect().width
				} else {
					this._slideWidth = (this.slides.length == 0) ? null : 0;
				}
			}
		} 
				 
		return ( (this._slideWidth == null) ? 0 : this._slideWidth );
		
	}
	
	get slidesContainerCount(){
		if ( ( this.slideWidth != undefined ) &&  ( this.slideWidth > 0 ) ) {
			return Math.floor( this.slideContainerWidth / this.slideWidth );
		} else {
			return this.slideCount;
		}
	}
	
	get slideCount () {
		if ( (this.slides != undefined) && (this.slides.length > 0) ) {
			return this.slides.length
		} else {
			return 0;
		}
	}
	
	get chunkId() {
		return ( this.currentLastIndex >=  this.chunkCount  ) ? Math.floor( this.currentLastIndex /  this.chunkCount ) - 1 : 0;
	}
	
	get currentLastIndex () {

		if ( (this.slides != undefined) && (this.slides.length > 0) ) {
						
			for(let index = 0; index < this.slides.length; index++){

				if ( ( this.slides[index].style.getPropertyValue('left') != undefined) && ( this.slides[index].style.getPropertyValue('left') != "")  ) {
					 
					let leftX = this.pixelSizeToInt( this.slides[index].style.getPropertyValue('left') );
					
					//getComputedStyle
					if ( leftX >= this.slideContainerWidth ) {
						return index - 1;
					}
				} else {
					return index;
				}
			}
			
			return this.slides.length ;
		} else {
			return 0;
		}
		
	}
	
	get currentIndex(){

		if ( (this.slides != undefined) && (this.slides.length > 0) ) {

			for(let index = 0; index < this.slides.length; index++){

				if ( ( this.slides[index].style.getPropertyValue('left') != undefined) && ( this.slides[index].style.getPropertyValue('left') != "")  ) {
					 
					let leftX = this.pixelSizeToInt( this.slides[index].style.getPropertyValue('left') );
					//getComputedStyle
					if ( leftX >= 0 ) {
						return index;
					}
				} else {
					return index;
				}
			}
			
			return this.slides.length ;
		} else {
			return 0;
		}
		
	}
	
	pixelSizeToInt(value){
		if ( (value!="") && ( value != undefined ) ){
			return parseInt( value.match(/(^\-?[0-9]+(\.[0-9]+)?)px$/i )[1]  );
		} else {
			return 0;
		}
	}

	makeTitleBar(className,aTitle,aSubtitle){
		var result = document.createElement('div'); 
		result.classList.add(className);
		
		var icon = document.createElement('div');
		icon.classList.add('icon');		
		
		var title = document.createElement('span');
		title.classList.add('title');
		title.innerHTML = aTitle; 
		
		var subtitle = document.createElement('span');
		subtitle.classList.add('subtitle');
		subtitle.innerHTML = aSubtitle;
		
		result.appendChild(icon);
		result.appendChild(title);
		result.appendChild(subtitle);
		return result;
		
	}
	
	makeContainer(className){
		var result = document.createElement('div'); 
		result.classList.add(className);
		return result;
	}
	
	makeButton(btnType){
		var result = document.createElement('button');
		result.classList.add("btn");
		var tagImg = document.createElement('img');
		if (btnType == LRButton.left) {
			
			result.classList.add("btn-left");		
			tagImg.src = DIR_CAROUSEL_SOURCE.concat('left-arrow.png');
			tagImg.alt="Prev";
			this.toggleButtonVisibility(result,this.hasLess);

		} else if (btnType == LRButton.right) {
			
			result.classList.add("btn-right");		
			this.toggleButtonVisibility(result,this.hasMore);
			tagImg.src = DIR_CAROUSEL_SOURCE.concat('right-arrow.png');
			tagImg.alt="Next";
		}
		
		result.appendChild(tagImg);
		return result;		
	}
	
	toggleButtonVisibility(button,condition){
		if (button != undefined){
			button.style.visibility = (condition) ? 'visible' : 'hidden';
		}
	}
	
	makeSlideContainer(aClassName,aClassNameCarousel){
		var result = document.createElement('div'); 
		result.classList.add(aClassName);
		var ulTag = document.createElement('ul'); 
		ulTag.classList.add(aClassNameCarousel);
		
		result.appendChild(ulTag);
		return result;
		
	}
	
	appendToSlideContainer(container,slides){
		
		if ( slides.toString().replaceAll(',','').length > 0 ){  // is not empty array
			
			slides.forEach(function(imgSrc,index){
				
				let tagLI = document.createElement('li');
				tagLI.classList.add('slide');
				tagLI.id = index;
				tagLI.style.visibility = 'hidden';
			
				let tagImg =  document.createElement('img');	
				if ( imgSrc != undefined ) {
					tagImg.src = DIR_CAROUSEL_SOURCE.concat(imgSrc);
				} else {
					tagImg.src = DIR_CAROUSEL_SOURCE.concat(IMG_NOT_FOUND);
				}
				
				tagLI.appendChild(tagImg);								
				container.appendChild(tagLI);
				
			});
			
		} else {
			//Create room for incoming images
			if ( slides.length > 0 ) {
				
				let slideWidth;
				let marginLeftSlot;
				let slotSize = Math.floor( this.slideContainerWidth / this.chunkCount );  		
				let centerSlotSize = Math.floor ( slotSize / 2 );				
				let left = slotSize;

				let baseIndex = container.childElementCount;				
				
				for(let index = 0; index < slides.length; index++){
					var tagLI = document.createElement('li');

					tagLI.classList.add('slide');
					if (this.args.container.charAt(0) == "#"){
						tagLI.id = this.args.container.substr(1)+'_'+( baseIndex + index );
					} else {
						tagLI.id = this.args.container+'_'+( baseIndex + index );						
					}
					
					var tagImg =  document.createElement('img');	
					tagImg.src = DIR_CAROUSEL_SOURCE.concat(IMG_WAIT);
					tagImg.classList.add('wait');
					
					// set the left position					
					tagLI.style.left = ( left * ( baseIndex + index ) )  + "px";
					tagLI.appendChild( document.createElement('div'));				
					tagLI.firstChild.appendChild(tagImg);
					
					let tagDivTitle = document.createElement('div');
					tagDivTitle.classList.add('title');
					tagDivTitle.innerHTML = '';
					tagLI.appendChild(tagDivTitle);
					
					let tagDivType = document.createElement('div');
					tagDivType.classList.add('type');
					tagDivType.innerHTML = '';
					tagDivType.style.visibility = 'hidden';

						let tagSpanDuration = document.createElement('span');
						tagSpanDuration.classList.add('duration');
						//tagSpanDuration.innerHTML = '';
						tagSpanDuration.style.visibility = 'hidden';
					
					tagDivType.appendChild(tagSpanDuration);
					
					tagLI.firstChild.appendChild(tagDivType);										

					container.appendChild(tagLI);
					
					// we need to calculate only one time
					slideWidth = (slideWidth == undefined) ? tagLI.getBoundingClientRect().width : slideWidth; 					
					marginLeftSlot = ( marginLeftSlot == undefined ) ? centerSlotSize - Math.floor( slideWidth / 2 ) : marginLeftSlot;
										
					// add to left position, marginleft value 
					tagLI.style.left =  ( marginLeftSlot  + ( left * ( baseIndex + index ) ) ) + "px";


				}
				
			}
			
		}
		
		this.slides = this.carousel.querySelectorAll('li.slide');
	}
	
	
	leftBtnOnClick(event){
		
		event.preventDefault();

		let visibleIndex  = ( ( this.currentIndex +  ( -1 * SCROLL_COUNT ) ) )
		
		let slotSize = Math.floor( this.slideContainerWidth / this.chunkCount );
		let left = slotSize;
				 
		let centerSlotSize = Math.floor ( slotSize / 2 );
		let marginLeftSlot = centerSlotSize - Math.floor( this.slideWidth / 2 );
		
				
		if ( visibleIndex >= 0 ) {
			
			for(let index = 0; index < this.slides.length; index++) {

				this.slides[index].style.left =  ( marginLeftSlot + ( left * ( index - visibleIndex )) ) + "px";
				
			}
			
			this.toggleButtonVisibility(this.leftButton,this.hasLess);		
			this.toggleButtonVisibility(this.rightButton,this.hasMore);

		}
		
	}
	
	rightBtnOnClick(event){
		
		event.preventDefault();
		// cache result to avoid overhead of call
		let visibleIndex  = ( ( this.currentIndex +  ( 1 * SCROLL_COUNT ) ) )
								
		if ( visibleIndex <= this.slides.length) {
			
			let lastIndex = this.slides.length - 1;
			let y = Math.floor( this.pixelSizeToInt( this.slides[lastIndex].style.getPropertyValue('left') ) );
			let w = Math.floor( this.slideContainerWidth );
			let sw = Math.floor( this.slideWidth );
						
			if ( ( y - ( w - sw ) ) < sw )   {
				
			
				this.queryImagesChunk(this.chunkId + 1).then(function(){
	
					this.redraw(visibleIndex);
					
					this.toggleButtonVisibility(this.rightButton,this.hasMore);
					this.toggleButtonVisibility(this.leftButton,this.hasLess);
					
				}.bind(this),
				
				function(error){
					alert(error);
				})
					
			} else {

				this.redraw(visibleIndex);
				this.toggleButtonVisibility(this.rightButton,this.hasMore);
				this.toggleButtonVisibility(this.leftButton,this.hasLess);
				
			}
			
		}
	}
	
	redraw(aVisibleIndex) {


		let slotSize = Math.floor( this.slideContainerWidth / this.chunkCount );
		let left = slotSize;
				 
		let centerSlotSize = Math.floor ( slotSize / 2 );
		let marginLeftSlot = centerSlotSize - Math.floor( this.slideWidth / 2 );
				
		for(let index = 0; index < this.cacheItems.length; index++) {
			
			if ( ( this.slides != undefined) && (this.slides[index] != undefined) ){
				 
				 this.slides[index].style.left =  ( marginLeftSlot + ( left * ( index - aVisibleIndex )) ) + "px";
				 this.slides[index].style.visibility = 'visible';
				 				 		
				 let tagIMG = this.slides[index].querySelector('img');			
				 				 
				if ( (tagIMG != undefined) && ( tagIMG.classList.contains('wait') ) ) {
										
					let id = parseInt(this.slides[index].id.match(/(.*)([\_]{1}([0-9]+$))/i)[3]);
					
					if (  (index == id ) && (this.cacheItems[id]!=null) ) {
											 
					 	tagIMG.src = DIR_CAROUSEL_SOURCE.concat(this.cacheItems[id].image);
						tagIMG.classList.remove('wait');
				
						if ( this.cacheItems[id].cardinality != "" ) {		
							this.slides[index].classList.add(this.cacheItems[id].cardinality);
						} else {
							this.slides[index].classList.add('single');
						}
						
						let tagTitle = this.slides[index].querySelector('div.title');
						if (tagTitle != undefined) {
							tagTitle.appendChild(document.createTextNode(this.cacheItems[id].title));//innerHTML = this.cacheItems[id].title;
						}
						let tagDivType = this.slides[index].querySelector('div.type');
						if (tagDivType != undefined) {
							tagDivType.style.visibility = 'visible';							
							tagDivType.appendChild(document.createTextNode(this.cacheItems[id].type));
							
						}
						let tagSpanDuration = this.slides[index].querySelector('span.duration');
						if (tagSpanDuration != undefined) {
							if ( ( this.cacheItems[id].duration != undefined) && (this.cacheItems[id].duration != "") ){ 
								tagSpanDuration.style.visibility = 'visible';
								tagSpanDuration.appendChild( document.createTextNode( this.cacheItems[id].duration.toHRTime() ) );//innerHTML = this.cacheItems[id].duration;
								
							}
						}
												
					}
				 }
				
			} else {
				
				let tagLI = document.createElement('li');
				tagLI.classList.add('slide');
				tagLI.id = index;				
				tagLI.style.left =  ( marginLeftSlot + ( left * ( index - aVisibleIndex )) ) + "px";
							
				let tagImg =  document.createElement('img');	
				tagImg.src = DIR_CAROUSEL_SOURCE.concat(this.cacheItems[index].image);
				
				tagLI.appendChild(document.createElement('div'));
				tagLI.firstChild.appendChild(tagImg);
				
				let tagDivTitle = document.createElement('div');
				tagDivTitle.classList.add('title');
				tagDivTitle.innerHTML = this.cacheItems[index].title;
				tagLI.appendChild(tagDivTitle);
				
				let tagDivType = document.createElement('div');
				tagDivType.classList.add('type');
				tagDivType.appendChild(document.createTextNode(this.cacheItems[index].type));
				//innerHTML = this.cacheItems[index].type;
				tagDivType.style.visibility = 'visible';
				
				if ( ( this.cacheItems[index].duration != undefined) && ( this.cacheItems[index].duration != "")) {
					let tagSpanDuration = document.createElement('span');
					tagSpanDuration.classList.add('duration');
					tagSpanDuration.appendChild( document.createTextNode( this.cacheItems[index].duration.toHRTime() ) );
					//innerHTML = this.cacheItems[index].duration;
					tagSpanDuration.style.visibility = 'visible';
					tagDivType.appendChild(tagSpanDuration);
					
				}
				
				if ( ( this.cacheItems[index].cardinality != undefined) && ( this.cacheItems[index].cardinality != "")) {
					tagLI.classList.add(this.cacheItems[index].cardinality);
				} else {
					tagLI.classList.add('single');
				}
				
				
				tagLI.firstChild.appendChild(tagDivType);



				this.carousel.appendChild(tagLI);
				
				
			}
							
							
		}
		
		this.slides = this.carousel.querySelectorAll('li.'+CLS_SLIDE);	
		
	}	
	
	async makeRequest(url){
		//console.log('this.makeRequest');
		return new Promise(function(resolve, reject) {
			if ( ( this.args != undefined ) && ( this.args.ferchCards != undefined ) ){
				setTimeout( function() {
						let result = this.args.ferchCards(this.chunkCount)
						resolve(result);
					}.bind(this),( TIMEOUT_SECONDS* Math.random() )*1000 );
			} else {
				reject('fetchCards function not defined');
			}
/*		
			var request = new XMLHttpRequest();
			request.open('GET', url);
			console.log(url);
			request.responseType = 'json';
			request.onload = function() {
		        if (request.status === 200) {				       
		          resolve(request.response);
		        } else {				       
		          reject(Error('error message:' + request.statusText));
		        }
		      };
			request.onerror = function() {
				reject(Error('network error.'));
			};

			request.send();
 */	
		}.bind(this));
			
	}	
	
	async queryImagesChunk(chunkId){

		return new Promise(function(resolve, reject) {
			
			if (this.needImages) {

				if ( this.currentIndex + this.slidesContainerCount >= ( this.slideCount - this.chunkCount ) ) {

					//check if data are in cache
					let dataImages = new Map();
					let baseIndex = this.slideCount;
					
					// this can be also used as param to function makeRequest
					//URL_REQUEST +'?id='+chunkId+'&chunksize='+this.chunkCount
					this.makeRequest().then(
																					
						function(response) {
							if (response === false){
								alert(' error loading images.');
							} else {
								
								// all chunk will load only with one call 
								this.needImages = false;													
										
								response.forEach(function(items){
									let i = 0;	
									items.forEach(function(item){										
										
										dataImages.set(baseIndex + i, item);
										i++;					
															
									}.bind(this));
									baseIndex += i;
																							
								}.bind(this))								
								
								this.addItemsToCache(dataImages);
								
								resolve(true);
								
								
							}

						}.bind(this),
						
						function(error){ 
							console.log(error);
							reject(error)
						}.bind(this)
									
					);
					
					this.appendToSlideContainer(this.carousel,new Array(this.chunkCount));				
				}
				
			} else {
				//all images are cached no need to load more
				resolve(true); 
			}

			
		}.bind(this));
			
	}
	
	
	addItemsToCache(dataImages){
		
		for (let [key,value] of dataImages){
			
			if ( this.cacheItems != undefined ) {
				
				// else items is already cached
				if	( this.cacheItems[key] == undefined )  {
									
						if ( key > this.cacheItems.length - 1) {
							
							for(let index = this.cacheItems.length; index < key; index++){
							
								this.cacheItems.push(undefined);	
							}
							
							this.cacheItems.push(value);
							
						} else {
							
							this.cacheItems[key] = value;
							
						}
														
					}
					
			} else {
				this.cacheItems.push = value;
			}

		}

	}		
	
//	CCarousel.prototype.walk = function() { ECMA5

		
}

