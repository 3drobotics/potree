# README
* [Getting Started](./docs/getting_started.md)

## Developing
1. Clone repo
2. `npm install --save-dev`
3. `npm run watch+liveserver`: Automatically opens tab on localhost:8080
4. Navigate to build/potree/examples/without_gui.html: ensure the point cloud viewer works correctly, and there are no errors in the console

## Developing with Sitescan Manager
Linking the yarn module to a local source allows for easily modifying the Potree package and viewing changes in sitescan
1. Clone potree repo
2. `yarn link` from potree directory
3. `yarn link "potree"` from sitescan-manager directory
4. `npm run-script build` from potree to build the standalone file
5. You'll need to close the current server and run `yarn start` again
6. sitescan-manager will now use the updated package!

## Deploying
1. All changes have been made on the `stripped` branch. Push new changes to this branch.
2. IMPORTANT: When you want these changes to be used by sitescan-manager, you must increment the version # in the package.json file.
3. The next time the website is deployed, it will use the updated version of Potree.


## Misc Tips
### Reseting Pointclouds for a mission
Eventually you will run out of pointclouds to process.
To reset the pointcloud for a mission:
1. Get Pointcloud Dataproduct ID via Redux inspector or Postman. 
2. Postman > Dataproducts > Delete a data product > use the PC ID
