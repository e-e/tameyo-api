require('./server').listen(process.env.PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`listening on https://localhost:${process.env.PORT}/!`);
  }
});