# 5609 Final Project: Interactivity-Rich Global Sales Visualization

## A fully implemented 2D/3D map that can show and compare relevant order information by country and city over time

Our team believed that sales dashboards often neglected geographic info which, if included, could ease understanding and save the tedium of looking through endless bar charts and spreadsheets. As such we implemented our map with these features:

- Map that allows for zooming and panning
- Togglable globe view
- Circle Map which shows the relevant data on a per-city basis
- Heat Map which shows the relevant data on a per-country basis
- Zoomable and pannable specific map for a country when clicked on
- Date selector and double slider to control data timeframe
- Animation player which shows how the data changes over time

To run this project yourself simply clone the repository and run:

```
    npm install
    npm run dev
```

## Acknowledgements:

The team members and their major contributions are as follows:

- Peter Olsen - Animation, projection swapping, zooming, bug fixes
- Ritvik Kosuri - Comparison menu, heatmap, circle map
- Derrick Dischinger - External country display menu
- Russell Shaver - Date manipulation

Datasets used:

- Order dataset: [Found here](https://www.kaggle.com/datasets/rohitgrewal/global-superstore-data/data)
- City dataset: [Found here](https://simplemaps.com/data/world-cities)
- GeoJSON data: [Found here](https://github.com/holtzy/D3-graph-gallery/blob/master/DATA/world.geojson)

Additionally this code was used as slider template: [Code](https://svelte.dev/playground/75d34e46cbe64bb68b7c2ac2c61931ce?version=5.45.9)

Special thanks to our professor Zhu-Tian Chen and TA Pan Hao for excellent teaching and direction.
