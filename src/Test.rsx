// Note: render() is provided by the RSX compiler, no import needed

export default function Test(props) {
  console.log("INIT once per instance");

  let counter = props.count;

  function handleClick() {
    counter+=1;
    console.log("counter++ ", counter);
    render();
    
  }
  update((prev, current) => {
    console.log("UPDATE", prev, "→", current);
  });

  view((current) => {
    console.log("VIEW", current, "counter =", counter); 
    return (
    <>
      <button onClick={handleClick}>Count: {counter} {current.count}</button>
    </>
  );
  });
}