'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var URI = require('urijs');
import {RadioGroup, Radio} from "react-radio-group";

var mountNode = document.getElementById('participant-form');

// Obtain question id from URL.
var uri = new URI(window.location.href);
var questionId = uri.search(true).question;

// Make sure question and participant slides are in sync.
// @TODO Ideally this should happen on `ques:get`. Currently there is no such
// event where we are loading only one question.
dpd.questionoptions.on('get', function(data) {
  // If the current participant slide is anything else than the question slide,
  // then we show the same participant slide as question slide.
  if (questionId != data.questionId) {
    let currentUrl = new URI(window.location.href);
    currentUrl.query({
      question: data.questionId
    });
    window.location.href = currentUrl.href();
  }
});

/**
 * Participant form component.
 */
class ParticipantForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOption: '',
      success: false
    };

    this.handlePostAnswer = this.handlePostAnswer.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }
  handlePostAnswer(event) {
    event.preventDefault();

    var postData = {
      'questionId': this.props.question.id,
      'answer': this.state.selectedOption,
      'userId': this.props.userId,
      'time': Date.now()
    };

    dpd.answer.post(postData, function(result, err) {
      if(err) return console.log(err);
      this.setState({
        success: true
      });
    }.bind(this));
  }
  handleOptionChange(option) {
    this.setState({
      selectedOption: option
    });
  }
  shouldComponentUpdate(nextProps, nextState) {
    // Update component ONLY IF answer post is successful.
    return nextState.success === true;
  }
  componentDidUpdate() {
    // Reset success state.
    if (this.state.success) {
      this.setState({
        success: false
      });
    }
  }
  render() {
    if (this.state.success) {
      // @TODO May be we can move this to a new component, or a mixin?
      var alert = <div className="alert alert-success alert-dismissible fade in" role="alert">
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
        <strong>Answer submitted</strong>
      </div>
      var submitButton = <button type="submit" className="btn btn-primary" disabled>Submit</button>
    }
    else {
      var alert = '';
      var submitButton = <button type="submit" className="btn btn-primary">Submit</button>
    }

    return (
      <div className="form-wrapper">
        {alert}
        <form onSubmit={this.handlePostAnswer}>
          <h3 className="question">{this.props.question.question}</h3>
          <RadioGroup name="options" className="options-wrapper well" onChange={this.handleOptionChange}>
            {this.props.questionOptions.map(function(currentValue, index, array) {
              return (
                <div className="radio">
                  <label>
                    <Radio value={currentValue} /> {currentValue}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
          {submitButton}
        </form>
      </div>
    );
  }
}

ParticipantForm.defaultProps = {
  question: {},
  questionOptions: []
}

class UserLogout extends React.Component {
  componentDidMount() {
    $('.logout').click(function() {
      dpd.users.logout(function() {
        window.location.href = 'login.html';
      });
    });
  }
  render() {
    return (
      <div className="text-right">
        <button type="button" className="btn btn-success logout">Log out</button>
      </div>
    );
  }
}

// If user is logged in, show them options.
// Otherwise, ask them to login first.
dpd.users.me(function(user) {
  if (user) {
    // Fetch question info and it's options, finally render the form.
    dpd.ques.get(questionId, function(question, error) {
      var query = {
        "questionId": questionId
      };

      dpd.questionoptions.get(query, function(questionOptions, error) {
        ReactDOM.render(
          <div>
            <UserLogout />
            <ParticipantForm question={question} questionOptions={questionOptions[0].options} userId={user.id} />
          </div>, mountNode);
      });
    });
  }
  else {
    ReactDOM.render(
      <p className="lead">
        Please <a href="login.html">login</a> before participating
      </p>, mountNode);
  }
});
