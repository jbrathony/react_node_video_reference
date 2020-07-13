import React from 'react';
import PropTypes from 'prop-types';

const SystemMessage = ({ message }) => {
  var show_message = message.text;
  return (
    <div className="message">
      <div className="message-content">
      <p className={`font-${message.color}`}>
          <small className="text">{show_message}</small>
        </p>
      </div>
    </div>
  );
};

SystemMessage.propTypes = {
  message: PropTypes.shape({
    sender: PropTypes.shape.isRequired,
    text: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    time: PropTypes.number.isRequired,
    consecutive: PropTypes.bool,
  }).isRequired,
};

export default SystemMessage;
