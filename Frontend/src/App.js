import React, { Component } from 'react';
import Logo from "./Components/Logo/Logo";
import Navigation from "./Components/Navigation/Navigation";
import ImageLinkForm from "./Components/ImageLinkForm/ImageLinkForm";
import Rank from "./Components/Rank/Rank";
import SignIn from "./Components/SignIn/SignIn";
import FaceRecognition from "./Components/FaceRecognition/FaceRecognition";
import Register from "./Components/Register/Register";
import Particles from 'react-particles-js';
import './App.css';
import Clarifai from 'clarifai';


const app = new Clarifai.App({
 apiKey: 'acd5a1a62e654c2ebf21d60c2a9989f8'
});

const particle_settings = {
particles: {
  number: {
      value: 50,
      density: {
        enable: true,
        value_area: 800
      },
    },
    }}

const initialState = {
  input: '',
  imageURL: '',
  box: {},
  route: "SignIn",
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageURL: '',
      box: {},
      route: "SignIn",
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: '',
      }
    }
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined,
    }});
  }

  componentDidMount() {
    fetch("https://sleepy-fortress-44080.herokuapp.com/")
      .then(response => response.json())
      .then(data => console.log(data));
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageURL: this.state.input});
    app.models.predict(Clarifai.FACE_DETECT_MODEL, 
      this.state.input)
    .then(response => {
        if (response) {
          fetch('https://sleepy-fortress-44080.herokuapp.com/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })

        }
        this.displayBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  calculateFaceLocation = (data) => {
    const server_data = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById("input_image");
    const width = Number(image.width);
    const height = Number(image.height);

    return {
      leftCol: server_data.left_col * width,
      topRow: server_data.top_row * height,
      rightCol: width - (server_data.right_col * width),
      bottomRow: height - (server_data.bottom_row * height),
    }
  }

  displayBox = (passed_in) => {
    this.setState({box: passed_in});

  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState);
      this.setState({route: "SignIn"});
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
      this.setState({route: route});
    } else {
      this.setState({route: route});
    }
    
  }


  render() {
    return (
      <div className="App">
      <Navigation onRouteChange={this.onRouteChange} isSignedIn={this.state.isSignedIn}/>
      <Particles className="particles" params={particle_settings}/>
      {this.state.route === "home"
      ? <div>
          <Logo />
          <Rank name={this.state.user.name} entries={this.state.user.entries}/>
          <ImageLinkForm 
          onInputChange={this.onInputChange} 
          onButtonSubmit={this.onButtonSubmit}/>
          <FaceRecognition box={this.state.box} imageURL={this.state.imageURL}/>
        </div>
      : (this.state.route === 'SignIn' 
          ? <SignIn onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
          : <Register onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
        )
      }
      </div>
    );
  }
}

export default App;


