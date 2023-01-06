'use strict';

const form = document.querySelector('.form');
const formRowHidden = document.querySelector('.form__row--hidden')
const containerWorkouts = document.querySelector('.workouts');
const workoutAll = document.querySelectorAll('.workout')
const inputType = document.querySelector('.form__input--type');
const forRowAll = document.querySelectorAll('.form__row')
const inputAll = document.querySelectorAll('.form__input');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteWorkout = document.querySelectorAll('.form-delete')

/********************App Data**************** */
class workoutData{
  click = 0;
  //public area 
  id = (Date.now() + '').slice(-10);//fake ID
  date = new Date;
  constructor(coords,distance,duration){
  //parameter is for dynamic value
  this.coords = coords;
  this.distance = distance;// in km
  this.duration = duration;//in min
  
  }

  _setWorkoutDate(){
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
this.date_description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    return this.date_description
  }

  clicks(){
    this.click++;
  }
}

class Running extends workoutData{
  type = 'running';
constructor(coords,distance,duration,cadence){
super(coords,distance,duration)
this.cadence = cadence;
this._calPace();
this._setWorkoutDate();
}

_calPace(){
  //min/km
 this.pace =  this.duration / this.distance
  return this.pace //created new property
}
}

class Cycling extends workoutData{
  type = 'cycling';
constructor(coords,distance,duration,elevation){
  super(coords,distance,duration)
  this.elevation = elevation
  this._calSpeed();
  this._setWorkoutDate();
}

_calSpeed(){
  // h/km
  this.speed = this.distance / (this.duration / 60) //min * 60 =h
  return this.speed
}
}

/*************************APP UI************************/
class mapUI{
  //public area
  #mapZoomLevel = 13;
  #workout = [];
  #map;
  #eventMap;
  constructor(){
    //create current work
    this.currentWorkoutObject; 
    this.formEditMode ;
    this._getPosition();
    //get localStorage data
    this._getLocalStorage();
   //toggle select
   inputType.addEventListener('change',this._toggleElevationField);
   //insert workout
  
    form.addEventListener('submit',this._formSubmitHandler.bind(this))
    containerWorkouts.addEventListener('click',this._workoutEvent.bind(this))
    containerWorkouts.addEventListener('click',this._deleteWorkout.bind(this))
    containerWorkouts.addEventListener('click',this._showEditWorkoutForm.bind(this))
  }

  //get current location
  _getPosition(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){//error
          alert('Could not get your position')
          })}}

  //load map
  _loadMap(position){
    const {latitude ,longitude} = position.coords
    const coords = [latitude ,longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    }).addTo(this.#map);
      //show form
      this.#map.on('click',this._showForm.bind(this))

      this.#workout.forEach(
        w => this._renderMaker(w))
  }

  _showForm(eventM){
    this.#eventMap = eventM;//make use global event to keep data flow of eventM
    form.classList.remove('hidden');
    inputDistance.focus();

  }

  _toggleElevationField(){
      let current = inputType.selectedIndex;
      if (current == 0) {
      formRowHidden.classList.add('form__row--hidden')
      inputCadence.closest('.form__row').classList.remove('form__row--hidden')
     
      } else if (current == 1) {
      formRowHidden.classList.remove('form__row--hidden')
      inputCadence.closest('.form__row').classList.add('form__row--hidden')
      }

  }

_formSubmitHandler(e){
  e.preventDefault();
const validateInput = (...inputs) => inputs.every(input => Number.isFinite(input) )
const positiveNumber = (...inputs) => inputs.every(input => input > 0  )
const valueInput = {
  type : inputType.value,
  distance : +inputDistance.value,
  duration : +inputDuration.value,
  cadence : +inputCadence.value,
  elevation : +inputElevation.value
}

if(valueInput.type === 'running'){
  if(!validateInput(valueInput.distance,valueInput.duration,valueInput.cadence) || !positiveNumber(valueInput.distance,valueInput.duration,valueInput.cadence)) 

  return alert('input has to be positive number')
}

if(valueInput.type === 'cycling'){
  if(!validateInput(valueInput.distance,valueInput.duration,valueInput.elevation) || !positiveNumber(valueInput.distance,valueInput.duration,valueInput.elevation)) 

  return alert('input has to be positive number')
}

// If user has clicked on Map, and Edit mode is false => creat new workout
if(this.#eventMap && !this.formEditMode) return this._newWorkout(valueInput)
//If user clcik on eadit and edit mode is true  => eadit workout
if(this.formEditMode) return this._editWorkout(valueInput)
else {
  alert('does not regconize action!');
  throw new Error('Does not regconize action, please review the _formSubmitHandle');
};
}

  _newWorkout(valueInput){
    this.formEditMode = false
const{distance,duration,cadence,elevation,type} = valueInput
const{lat,lng} = this.#eventMap.latlng;//from leaflet
const currentCoords = [lat,lng];
let workout;//as global variable that to be able access both running & cycling

//if activity running create running object
if(type === 'running'){
workout = new Running(currentCoords,distance,duration,cadence)
}

//if activity cycling create cycling object
if(type === 'cycling'){
  workout= new Cycling(currentCoords,distance,duration,elevation)
}

//And new object to workout array to be store in localStorage
this.#workout.push(workout);

//render workout on map as marker
this._renderMaker(workout);

//render workout to list
this._insertWorkOut(workout);
//clear input friend
this._clearAllField();
//set data to localStorage
this._setLocalStorage();
}

_renderMaker(workout){
  const latlng = L.latLng(workout.coords);
  //display marker
      L.marker(workout.coords).addTo(this.#map)
      .bindPopup(L.popup(latlng,{
          content:`<p>${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.date_description}</p>`,
          autoClose:false,
          maxWidth:250,
          minWidth:100,
          closeOnClick:false,
          className:`${workout.type}-popup`
      }))
      .openPopup();
}

  _insertWorkOut(workout){

    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
                  <h2 class="workout__title">${workout.date_description}</h2>
                 <div class="editOrdelete">
                  <i class="fas fa-edit form-edit"></i>
                  <i class="fa fa-trash form-delete" aria-hidden="true"></i>
                  </div>
                  <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">${workout.distance}</span>
                  </div>
    `;
                  //after submit we close the form
                 if(workout.type === 'running'){
                  html+= `<div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                  </div>
                  <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                  </div>
                </li>`
                 }

                 if(workout.type === 'cycling'){
                  html+=`<div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevation}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>`
                 }
                 form.insertAdjacentHTML('afterend',html)
             
  }

  _clearAllField(){
    inputAll.forEach(input => 
      input.value = '');
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid',1000)
    //after hide the form put back the display grid property
  }
  _workoutEvent(e){
    //if the map haven't loaded yet then return nothing
    if(!this.#map) return
    const workoutEl = e.target.closest('.workout')
    //we select all workout sibling
    if(!workoutEl) return 
     //delete workout 
    //from all workout array find the one that has same id with e.target element
    const thisWorkoutObject = this.#workout.find(w => w.id === workoutEl.dataset.id )
     
    this.#map.setView(thisWorkoutObject.coords,this.#mapZoomLevel,{
      animate:true,
      pan:{
        duration:1
      }
    });
  }

    //edit workout when click show form again
    _showEditWorkoutForm(e){
      if(!this.#map) return;
  
      if(e.target.matches('.form-edit')){
     
        this.formEditMode = true;
        form.classList.remove('hidden')
        const currentWorkout = e.target.closest('.workout')
        if(!currentWorkout) return;
        //assign value to global variable 
        this.currentWorkoutObject = this.#workout.find(w => w.id === currentWorkout.dataset.id)
      //hide form
      }
    }

  _editWorkout(valueInput){
    // if(!this.#map) return;
    const{distance,duration,cadence,elevation,type} = valueInput
 
    if(type === 'running'){
      console.log('run')
      this.currentWorkoutObject.type = type
      this.currentWorkoutObject.distance = distance;
      this.currentWorkoutObject.duration = duration;
      this.currentWorkoutObject.cadence = cadence;
      this.currentWorkoutObject.pace =  this.currentWorkoutObject.duration / this.currentWorkoutObject.distance
      console.log(this.currentWorkoutObject)
      this._setLocalStorage();
      this.#workout.forEach(
        w => this._renderMaker(w))
      location.reload();
      this.FormEditMode = false;
    }
    if(type === 'cycling'){
      console.log('cycling')
      this.currentWorkoutObject.type = type
      this.currentWorkoutObject.distance = distance;
      this.currentWorkoutObject.duration = duration;
      this.currentWorkoutObject.elevation = elevation;
      this.currentWorkoutObject.speed = this.currentWorkoutObject.distance / (this.currentWorkoutObject.duration/60)

      this._setLocalStorage();
      this.#workout.forEach(
        w => this._renderMaker(w))
      location.reload();
      this.FormEditMode = false;
    }
  }
  

  _deleteWorkout(e){
//logic ok
    if(!this.#map) return;
    if(e.target.matches('.form-delete')){
      const currentWorkout = e.target.closest('.workout');
     
      if(!currentWorkout) return;
      const deleteObject = this.#workout.find(w => w.id === currentWorkout.dataset.id);
      currentWorkout.style.display = 'none';
      this.#workout.pop(deleteObject)
      this._setLocalStorage();
      location.reload();
     }
  }

  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workout))
  }
  _getLocalStorage(){
   const data =  JSON.parse(localStorage.getItem('workouts'))
   if(!data) return
   //prevent we lose prototype chain!!
   data.forEach(
    (it) => it.__proto__ = it.type === "running" ? Running.prototype : Cycling.prototype
  );

   this.#workout = data 
   this.#workout.forEach(
    w => this._insertWorkOut(w))
  }
  _resetLocalStorage(){
    localStorage.remove('workouts');
    location.reload();
  }
}

const app = new mapUI()
