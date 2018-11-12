import React, { Component } from 'react';
import './App.css';
import * as R from 'ramda';
import ReactSpeedometer from 'react-d3-speedometer';
import MicrophoneStream from 'microphone-stream';
import getUserMedia from 'get-user-media-promise';
import MicGainController from 'mediastream-gain';
import 'semantic-ui-css/semantic.min.css';
import { Container, Grid, Statistic, Button } from 'semantic-ui-react';
//import ema from 'exponential-moving-average';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      height: 300,
      width: 500,
      maxValue: 100,
      sampleSize: 2,
      meter: null,
      gain: null,
      current: 0,
      max: [],
      min: 1,
      update: false,
      sample: [],
    }
  }
  componentDidMount() {
    
  var micStream = new MicrophoneStream();
  let { sampleSize } = this.state;
  this.setState({
    meter: micStream
  });

  getUserMedia({ video: false, audio: true })
    .then((stream) => {
      micStream.setStream(stream);
      var gainer = new MicGainController(stream);
      console.log(gainer);
      this.setState({
        gain: gainer
      })
    }).catch(function(error) {
      console.log(error);
    });
 
    micStream.on('format', function(format) {
      console.log(format);
    });

    micStream.on('data', (chunk) => {
      if (!this.state.update) {
        return
      }
      var raw32 = MicrophoneStream.toRaw(chunk);
      var raw = Float64Array.from(raw32);
      var s = R.append(R.sum(R.map(a => (a*a), raw)), this.state.sample);
      //console.log(s);
      
      //console.log(s);
      if (R.length(this.state.sample) === sampleSize) {
        var m = R.mean(s);
        var min = R.min(this.state.min, m);
        var current = min > 0 ? m/min : m;
        //var max = R.max(this.state.max, current);
        this.setState({
          current: current,
          max: R.append(current, this.state.max),
          min: min,
          sample: []
        })
      } else {
        this.setState({
          sample: s
        })
      }
      
    //...
 
    // note: if you set options.objectMode=true, the `data` event will output AudioBuffers instead of Buffers
    });
  }
  componentWillUnmount() {
    this.state.meter.stop();
  }
  reset() {
    this.setState({
      max: [],
      sample: [],
      current: 0
    });
  }
  toggleStart() {
    this.setState({
      update: !this.state.update
    })
  }

  render() {
    var current = (Math.round(10*Math.log10(this.state.current)*100)/100).toFixed(2);
    var max = (Math.round(10*Math.log10(R.mean(R.takeLast(20, this.state.max)))*100)/100).toFixed(2);
    console.log(this.state.max, max)
    return (
      <Container textAlign='center'>     
          <div className='header'>Sembrando Ideas Verdes</div>
          
          <Grid columns={2}>
          <Grid.Row>
          <Grid.Column>
              <ReactSpeedometer 
              minValue={0} 
              maxValue={this.state.maxValue} 
              needleTransitionDuration={200} 
              height={this.state.height}
              width={this.state.width}
              value={isFinite(current) ? current : 0} />
          </Grid.Column>
          <Grid.Column>
            <Statistic>
              <Statistic.Value>{isFinite(max) ? max : 0}</Statistic.Value>
              <Statistic.Label>dB</Statistic.Label>
            </Statistic>
          </Grid.Column>
          </Grid.Row>
          </Grid>
          <Grid>
            <Grid.Row>
              <Button onClick={() => this.reset()}>Reset</Button>
              <Button onClick={() => this.toggleStart()}>{this.state.update ? 'Stop' : 'Start'}</Button>
            </Grid.Row>
          </Grid>
      </Container>
    );
  }
}

export default App;
