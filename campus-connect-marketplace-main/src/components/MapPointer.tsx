import React from 'react';

type MapPointerProps = React.HTMLAttributes<HTMLDivElement> & {
  src: string;
  alt?: string;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  hasTail?: boolean;
  style?: React.CSSProperties;
};

const MapPointer = ({
  src,
  alt = 'profile',
  size = 70,
  borderWidth = 4,
  borderColor = 'white',
  hasTail = false,
  style = {},
  ...props
}: MapPointerProps) => {
  const circleStyle: React.CSSProperties = {
    width: size,
    height: size,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    backgroundColor: '#fff',
    position: 'relative',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    ...style,
  };

  return (
    <div
      className="map-pointer"
      style={circleStyle}
      onMouseEnter={(event) => (event.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)')}
      onMouseLeave={(event) => (event.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {hasTail ? (
        <div
          style={{
            position: 'absolute',
            bottom: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `15px solid ${borderColor}`,
            filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.2))',
          }}
        />
      ) : null}
    </div>
  );
};

export default MapPointer;
