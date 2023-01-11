/**********************************************************************************

@Description	: This nodeJS script uses serpAPI to search Google for a string 
				and grabbs emails associated with the results.Originally meant for
				Shopify sites though can be modified to get any site.
@Creator		: DarkZeus2002
@Date			: 2022.08.15
@Last Modified	: 2022.08.17
@Revision		: rev8

**********************************************************************************/

/***************************Best Search Tems**************************************
@ https://www.youtube.com/watch?time_continue=148&v=tdBEt2Kys_0&feature=emb_logo&ab_channel=OnHOW
@ intext:"powered by shopify" intext:"category";
@ site:myshopify.com intext:"category";
@ 
**********************************************************************************/

/*Importing required libs*/
const axios = require('axios');
const fs = require('fs');

/*VARIABLES*/

/*Search details*/
search = 'site:myshopify.com'; //search string
search_engine = 'google'; //search engine to use ('google')
global_loaction = ''; //country to search from use : https://serpapi.com/google-countries for reference
results = 50; // total results needed per page result count (max 100)
start= 1; //
total= 50; // total results needed (max ~400)

/*Auth details - serpapi*/
api_key ='<SERP API KEY>'; //serpapi

/*Data output file related vars - csv*/
const output='data_gen(gen).csv'; //output file name
const content = 'pos,Url,Email,Facebook,Youtube,Instagram,Tweeter,Pinterest\n' //headers

const new_f = 1; //Bool telling whether it's a new file or an extension

/*Alternative pages to look for email (put MOST PROBABLE first to contain the email to reduce time)*/
contact_pages=["pages/contact-us","pages/contact","pages/about-us","pages/contact-old","pages/aboutus"];

/*Essensial Vars (!DO NOT CHANGE!)*/
/*
const engine_paras = {
	'google':{
		'query':'q',
		's_loc':'gl'	
	},
	'bing':{
		
	}
}*/
var email='';
var fnd=0;
var site_html='';
var email1='';
var fb='';
var yt='';
var insta='';
var pint='';
var twt='';
pos_emails=[];
may_emails=[];
email1_d=[];
emails=[];

//Adding the first line to data file - must change [new_f] to 1 if appending//
if (new_f !== 1){
	fs.writeFile(output, content, err => {
	  if (err) {
		console.error(err)
		return
	  }
	  //file written successfully
	})
}

/*main API function*/
async function httpGet(){
	for(m=((start-1)/100);m<(total/results);m++){
		/*Readying the API call*/
		url = 'https://serpapi.com/search.json?engine=+'+search_engine+'&q='+search+'&num='+results+'&start='+(m*100+1)+'&gl='+global_loaction+'&api_key='+api_key; //URL of the fandom site

		full_url = url; //Building the API call
		console.log(full_url + "\n\n"); //Debugging line
		
		/*API call*/
		await axios
		  .get(full_url)
		  .then(async res => {
				//console.log(res.data.items);
				data=res.data.organic_results; // Isolating the normal results
				for(i=0;i<data.length;i++){
					site=data[i].link; // Getting the URLs of the sites
					site=site.match(/^(([a-z]+:)?(\/\/)?[^\/]+\/).*$/)[1];; //Removing everything after .com
					console.log(site); // Debugging line
					/*Calling email grabber function*/
					await getEmail(site,i).then(({url , mail , fb , yt , insta , twt , pint , num}) => {
						/*Logging the result*/
						console.log(((m*100)+1+num) + ". URL: "+ url + "\n email: " + mail + "\n facebook: " + fb + "\n youtube: " + yt + "\n instagram: " + insta + "\n tweeter:"+ twt + '\n pinterest:' + pint);
						/*Writing the result to a file*/
						fs.appendFile(output, ((m*100)+1+num) + ',' + url + ',' + mail + ',' + fb + ',' + yt + ',' + insta + ',' + twt + ',' + pint + '\n', function (err) {
							if (err) throw err;
								console.log('Saved!');
						});
					});
				}
			})
			.catch(error => {
				console.error(error); //Logging errors if there were any
			});
	}
}

/*Email grabber function*/
async function getEmail(site_url,num){
	/*Initial request for main site url*/
	email='';
	email = await axios.get(site_url).then(res => {
		site_html = res.data; //Isolating Site structure
		email = site_html.split('href="mailto:').pop().split('"')[0]; //Getting email if in a proper format*/
		/*Getting social media links*/
		fb= 'https://www.facebook.com/' + res.data.split('facebook.com/').pop().split('"')[0];
		fb = fb.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); //Replacing line-breaks and , to not to mess up .csv
		yt='https://www.youtube.com/' + res.data.split('www.youtube.com/').pop().split('"')[0];
		yt=yt.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); //Replacing line-breaks and , to not to mess up .csv
		insta='https://instagram.com/' + res.data.split('instagram.com/').pop().split('"')[0];
		insta=insta.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); //Replacing line-breaks and , to not to mess up .csv
		pint = 'https://www.pinterest.com/' +res.data.split('pinterest.com/').pop().split('"')[0];
		pint=pint.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); //Replacing line-breaks and , to not to mess up .csv
		twt = 'https://twitter.com/' +res.data.split('twitter.com/').pop().split('"')[0];
		twt=twt.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); //Replacing line-breaks and , to not to mess up .csv
		/*Looking for Alternative ways emails can be written if main method gives wrong output*/
		if (email.toLowerCase().indexOf("<") !== -1) {
			may_emails=site_html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);//Looking for Alternative ways emails can be written
			if (may_emails[0]){	
				for(j=0;j<may_emails.length;j++){
					metol=may_emails[j].toLowerCase(); // may-emails-to-lowercase so can check for possible image files and such
					if((metol.indexOf(".png") === -1) && (metol.indexOf(".jpg") === -1) && (metol.indexOf(".jpeg")=== -1) && (metol.indexOf(".gif")=== -1) && (metol.indexOf(".webp")=== -1)){
						pos_emails.push(may_emails[j]);
					}
				}
				email=pos_emails.join('/'); // joining possible emails to a string
				fnd=0; // telling that absolute email is not found
				return email;
			}else{
				fnd=0; // telling that email is not found
				return email;
			}				
		}else{
			fnd=1; // telling that absolute email is found
		}
		return email;
		//console.log(res.data); //Debugging line	
		//console.log(res.data.split('href="mailto:').pop().split('"')[0]);	//Debugging line
	}).catch(error => {
		//console.error(error); //Logging errors if there were any
	}); 
		  
	/*If absolute email is not found in main call*/
	if (fnd==0) {
		/*going through each possible contact page in contact_pages array*/
		for(p=0;p<contact_pages.length;p++){
			/*Reducing the search area by abandoning if a absolute email is found in a contact page*/
			if(fnd==0){
				err_url=site_url+contact_pages[p]; // making contact page URL
				console.log ('err_url : ' +err_url);
				email1 = await axios.get(err_url).then(res => {
					email1_d= res.data.split('href="mailto:').pop().split('"')[0];  //Getting Email if in a proper format*/
					/*Looking for Alternative ways emails can be written if main method gives wrong output*/
					if(email1_d.toLowerCase().indexOf("<") !== -1) {
						email1_d='';
						may_emails=res.data.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
						if (may_emails[0]){	
							for(j=0;j<may_emails.length;j++){
								metol=may_emails[j].toLowerCase(); // may-emails-to-lowercase so can check for possible image files and such
								if((metol.indexOf(".png") === -1) && (metol.indexOf(".jpg") === -1) && (metol.indexOf(".jpeg")=== -1) && (metol.indexOf(".gif")=== -1) && (metol.indexOf(".webp")=== -1)){
									pos_emails.push(may_emails[j]);
								}
							}
							email1+=pos_emails.join('/');
							fnd=0;
							//console.error('error2');
							return email1;
						}
					}else{
						fnd=1;
						//console.error('error1');
						email1=email1_d;
						return email1;
					}
					//console.log(email1); //Debugging line
			  })
			  .catch(error => {
				// console.error('error'); //Logging errors if there were any
				 return email1;
				
			  });
			}
		}		
	} 
	/*Debugging lines*/
	
	//console.log('\n\n*********Debugging Details*********\n\nfnd: '+ fnd)
	//console.log('email : ' + email);
	//console.log('email1 : ' + email1 + '\n\n*******************************');
	
	/*Formatting emails if there were any errors*/
	if(fnd==0){
		if((!email || email.toLowerCase().indexOf("<") !== -1) && (!email1)){
			//console.log('i was here');
			email='not provided';
		}else if(!email || email.toLowerCase().indexOf("<") !== -1){
			email=email1;
		}else if(!email1){
			email=email;
		}else{
			email = email + '/' + email1;
		}
	}else{
		if((!email || email.toLowerCase().indexOf("<") !== -1) && (!email1)){
			//console.log('i was here');
			email='not provided';
		}else if(!email || email.toLowerCase().indexOf("<") !== -1){
			email=email1;
		}else if(!email1){
			email=email;
		}else{
			email = email + '/' + email1;
		}
	}
	email1='';
	pos_emails=[];
	may_emails=[];
	fnd=0;
	
	/*Formatting social media accounts if there was any error*/
	if (fb.toLowerCase().indexOf("<") !== -1) { //"<!doctype html>" was the original selector. Changed due to returning absurd values because site not configured properly in HTML 5
		fb="undefined";
	}
	if (yt.toLowerCase().indexOf("<") !== -1) {
		yt="undefined";
	}
	if (insta.toLowerCase().indexOf("<") !== -1) {
		insta="undefined";
	}
	if (twt.toLowerCase().indexOf("<") !== -1) {
		twt="undefined";
	}
	if (pint.toLowerCase().indexOf("<") !== -1) {
		pint="undefined";
	}
	
	email=await email.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, ";"); // Replacing any linebrakes or , characters to not to mess the .csv file
	email=email.toLowerCase(); // Make every email lover-case to compare
	//console.log(await email); //Debugging line
	emails=email.split('/'); // Making an array of emails
	email=[...new Set(emails)]; // Creating a new set of emails from the Array so removing every duplicate
	email=email.join('/'); //Rejoining array to a string of emails divided by '/'

	//console.log('Email: '+await email); Debugging line
	//data = "URL: "+ site_url + " email: " +email;
	return await {url:site_url , mail:email ,fb:fb ,yt:yt ,insta:insta , twt:twt , pint:pint , num:num}; //Returning the result
}

httpGet(); // Calling the main function


//setInterval(httpGet,1000); //Test mode set to 1 second //calling the fetch function every 1h
//,contactanos,
