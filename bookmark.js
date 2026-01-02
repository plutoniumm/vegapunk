javascript: ( function () {
  const sel = window.getSelection().toString();
  if ( !sel ) return;

  const encoded = encodeURIComponent( sel );
  if ( navigator.clipboard )
    navigator.clipboard.writeText( encoded );

  const data = JSON.stringify( { text: sel } );
  const url = "https://punk.manav.ch/";
  const iframe = document.createElement( "iframe" );
  iframe.src = url;
  iframe.name = data;
  const style = {
    position: "fixed",
    top: "5vh",
    left: "5vw",
    width: "90vw",
    height: "90vh",
    border: "2px solid #fff",
    borderRadius: "10px",
    zIndex: "2147483647"
  };

  Object.assign( iframe.style, style );
  document.body.appendChild( iframe );
} )();