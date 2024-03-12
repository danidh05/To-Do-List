//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema={
  name:String
};

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Work",
});

const item2=new Item({
  name:"nja7",
});

const item3=new Item({
  name:"fshaal",
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items:[itemsSchema]
};
  
const List =mongoose.model("List",listSchema);

app.get("/", function(req, res) {

Item.find({})
  .then(foundItems=>{
    if(foundItems.length===0){
      //if there is no items we simply insert the defaultitems
    Item.insertMany(defaultItems)
  .then((result) => {
    console.log(`Successfully inserted ${result.length} items`);
   // Fetch the items again after insertion
    return Item.find({});
  })
  .then(updatedItems => {
    console.log(updatedItems);
    res.render("list", { listTitle: "Today", newListItems: updatedItems });
  })
  .catch((error) => {
    console.error('Error inserting items:', error);
    res.status(500).send('Internal Server Error');
      });
    console.log(foundItems);
     res.redirect("/");
  //  res.render("list", {listTitle: "Today", newListItems: foundItems});

  }else{
     // If there are existing items, render the list with those items
    res.render("list",{listTitle:"Today",newListItems:foundItems});
  }})
  .catch(err=>{
    console.log(err);
  })

});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
     // Attempt to find a list in the database with the given customListName
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
     //  If no list is found, log a message and create a new list with default items
      console.log("List doesn't exist");
      const list=new List({
        name:customListName,
        items:defaultItems
      });
      await list.save();
      // Wait until the save operation is complete

        // Redirect to the newly created list
      res.redirect("/"+ customListName);
    } else {
      console.log("List exists");
      // Render the list with its items
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.log(err);
    // Handle the error as needed
    res.status(500).send('Internal Server Error');
  }

})

app.post("/",async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item= new Item({
    name:itemName
  });

  try{
  if(listName==="Today"){
  await item.save();
  res.redirect("/");//we redirected to the home route
//Without the redirection, if the user refreshes the page or navigates away and then returns, the form might be resubmitted and dublicated
  }else{
   const foundList=await List.findOne({name:listName}).exec();
  
   if (foundList && foundList instanceof List){
     // Ensure foundList.items is an array before pushing the item
     foundList.items=foundList.items || [];
     foundList.items.push(item);
     await foundList.save();
      res.redirect("/" + listName)
   }else{
    console.log("list not found: ",foundList);
    res.status(404).send("List not found.");
  }
  }
    }catch(err){
      console.error(err);
      res.status(500).send('Internal Server Error');
     }
    });
  


app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName =req.body.listName;

if(listName==="Today"){
  Item.findByIdAndDelete(checkedItemId)
  .then(()=>console.log('item is deleted '))
  .catch(err=>console.log(err));
  res.redirect("/")

}else{
List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}})
.then(()=>{res.redirect("/" + listName);})

.catch((err) => {
  // Handle errors if needed
  console.error(err);
});
}
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
