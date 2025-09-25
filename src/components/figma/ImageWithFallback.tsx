import React from 'react';

const ImageWithFallback = ({ src, fallback, ...props }) => {
  const [error, setError] = React.useState(false);

  const handleError = () => {
    setError(true);
  };

  return (
    <img
      src={error ? fallback : src}
      onError={handleError}
      {...props}
    />
  );
};

export default ImageWithFallback;
