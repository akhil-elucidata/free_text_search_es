function parse_exact_match_words(inp){
    //let exact_match_key= "em" //keep lowercase
    let ei=-1,si; 
    for(let i=inp.length-1;i>=0;i--){
        let ch= inp[i];
        if(ch=="\"" && ei==-1)  ei=i;
        else if(ch=="\"" && ei!==-1){
            si=i;
            EXACT_MATCH_WORDS.push(inp.slice(si+1,ei)); 
            console.log("emw",EXACT_MATCH_WORDS.length-1,"=",EXACT_MATCH_WORDS[EXACT_MATCH_WORDS.length-1]);
            inp= inp.slice(0,si) + EXACT_MATCH_KEY + "_" + (EXACT_MATCH_WORDS.length-1).toString() + "_" + inp.slice(ei+1);
            ei=-1;
        }
    }
    if(ei!==-1) return(-1);
    console.log("Converted inp=",inp);
    return(inp);
    
    // else if(mode=="replace_back"){
    //     let si;
    //     while(si=inp.search(exact_match_key),si!==-1){
    //         if(exact_words.length==0)   return(0);
    //         inp= inp.slice(0,si) + exact_words[0] + inp.slice(si+exact_match_key.length);
    //         exact_words.splice(0,1);
    //     }
    //     return(inp);
    // }
}

function parse_brackets(inp){
    let st=[], elems=[], ninp= [];
    for (let i=0; i<inp.length; i++){
        ninp.push([inp[i],i]);
    }
    for (let item of ninp){
        let ch= item[0], ind= item[1];
        if(ch!==')')
            st.push(item);
        else{
            let elem= "", found=false;
            while(st.length>0){
                let x= st.pop();
                if(x[0]=='('){
                    found=true; elem= [x[1],ind]; elems.push(elem); break;
                }
            }
            if(found==false)    return 0;
        }
    }
    while(st.length>0){
        let x= st.pop();
        if(x[0]=='(')   return 0;
    }
    return elems;
}

// let elems= parse_brackets("z(a(bc)(d(ef))g)")
// for(item of elems)
//     console.log(item);

function arrayEquals(a, b) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}

function normalise_inp(inp){

    inp= inp.toLowerCase();

    function n1(inp){  //strip spaces
        let ninp= inp.trim();
        if(ninp.length!=inp.length) return([true,ninp]);
        return([false,inp]);
    }
    function n2(inp){  //strip ops
        let ops= new Set(['&','|','~']);
        if(ops.has(inp[0]) || ops.has(inp[inp.length-1])){
            let i=0;
            while(i<inp.length && ops.has(inp[i]))  i++;
            inp= inp.slice(i);
            i= inp.length - 1;
            while(i>0 && ops.has(inp[i]))   i--;
            inp= inp.slice(0,i+1);
            return([true,inp]);
        }
        else return([false,inp]);
    }
    function n3(inp){ //strip outermost brackets
        blst= parse_brackets(inp);
        let rmv_outer= false;
        for(let item of blst){
            let x= arrayEquals(item,[0,inp.length-1]);  
            if(x){ rmv_outer=true;  break; }
        }
        if(rmv_outer){ inp= inp.slice(1,inp.length-1); return([true,inp]); }
        else return([false,inp]);
    }

    while(true){
        let a,b,c,oinp=inp;  
        if(a=n1(inp),a[0])    inp=a[1];
        else if(b=n2(inp),b[0]) inp=b[1];
        else if(c=n3(inp),c[0]) inp=c[1];
        if(inp==oinp)   break;
    }

    console.log("Step1-3: converted inp=",inp);

    //let intersect = new Set([...a].filter(i => b.has(i)));
    //let union = new Set([...a, ...b]);

    function n4(inp){
        //remove extra spaces from between, replace space-> OR (default-op) if required
        let ops= new Set(['&','|','~']);
        let i=0, ninp="";
        while(i<inp.length){
            let ch= inp[i];
            if(ch==' ' || ch=='\t'){
                let j= i+1; 
                while(inp[j]==' ' || inp[j]=='\t')  j+=1;
                let tunion1= new Set([...ops, '(']); 
                let tunion2= new Set([...ops, ')']); 
                if( !(tunion1.has(inp[i-1])) && !(tunion2.has(inp[j])) ){
                    if(inp[i-1]==')' || inp[j]=='(')
                        ninp= ninp+"|";
                    else{
                        //Go left in ninp, but right in inp
                        let left=ninp.length-1, right=j-1;
                        let tunion3= new Set([...ops, '(', ')', '"']);
                        while(left>=0 && !tunion3.has(ninp[left]))  left--;
                        while(right<inp.length && !tunion3.has(inp[right]))  right++;
                        console.log("bzz:",left,right,"--",ninp,"--",inp)
                        let nninp="";
                        for(let ind=j;ind<right;ind++){
                            if((inp[ind]==" " || inp[ind]=="\t") && (inp[ind+1]==" " || inp[ind+1]=="\t")){
                                let pass;
                            }
                            else nninp= nninp+ inp[ind];  
                        }
                        nninp= ninp.slice(left+1) + " " + nninp;
                        nninp= nninp.trim();
                        EXACT_MATCH_WORDS.push(nninp); 
                        console.log("emw",EXACT_MATCH_WORDS.length-1,"=",EXACT_MATCH_WORDS[EXACT_MATCH_WORDS.length-1]);
                        ninp= ninp.slice(0,left+1) + (EXACT_MATCH_KEY + "_0" + (EXACT_MATCH_WORDS.length-1).toString() + "_");
                        j= right;
                    }
                }
                else{ let pass; }
                i=j-1;
            }
            else    ninp= ninp+ch;
            i= i+1;
        }
        inp= ninp;
        return(inp);
    }

    inp= n4(inp);
    console.log("Step4: converted inp=",inp);

    function n5(inp){
        //op bfr/after bracket :: (elem)op(elem) :: default op='|'
        let ops= new Set(['&','|','~']);
        let i=0;
        while(i<inp.length){
            let ch= inp[i];
            let tunion1 = new Set([...ops, ')']);
            let tunion2 = new Set([...ops, '(']);
            if( ch==')' && i+1<inp.length && !(tunion1.has(inp[i+1]))  ){
                inp= inp.slice(0,i+1) + "|" + inp.slice(i+1);
                i++;
            }
            else if( ch=='(' && i-1>=0 && !(tunion2.has(inp[i-1]))  ){
                inp= inp.slice(0,i) + "|" + inp.slice(i);
                i++;
            }
            i++;
        }
        return(inp);
    }

    inp= n5(inp);
    console.log("Step5: converted inp=",inp);

    function n6(inp){
        //remove brackets enclosing no-op text (word) 
        let ops= new Set(['&','|','~']);
        let blst= parse_brackets(inp);
        
        let rmv_inds= [];
        for(let item of blst){
            let si=item[0], ei=item[1];
            let txt= inp.slice(si+1,ei);
            let a= new Set(txt);
            let intersect = new Set([...a].filter(i => ops.has(i)));
            if( intersect.size ==0 ){
                rmv_inds.push(si); rmv_inds.push(ei);
            }
        }
        rmv_inds.sort(function(a, b){return b - a});
        for(let ind of rmv_inds)
            inp= inp.slice(0,ind) + inp.slice(ind+1);
        return(inp);
    }
    inp= n6(inp);
    console.log("Step6: converted inp=",inp);

    function n7(inp){
        //elem enclosed in bracket :: (elem)op
        let ops= new Set(['&','|','~']);
        let a= new Set(inp);
        let intersect = new Set([...a].filter(i => ops.has(i)));
        if( intersect.size ==0 ){
            if( inp[0]!=='(')   inp= '('+inp+')';
        }
        else{
            let blst= parse_brackets(inp);
            let i=0, last_op_i=-1;
            while( i<inp.length ){
                let ch= inp[i]; 
                if( ops.has(ch) ){
                    last_op_i= i;
                    let ei= i-1;
                    let j=i-1;
                    let tunion1= new Set([...ops, '(']); 
                    while( j>=0 && !(tunion1.has(inp[j])) )
                        j-=1;
                    let si= j+1;
                    let chk_pres= false;
                    for(let item of blst){
                        if( arrayEquals(item,[si-1,ei+1]) ){
                            chk_pres= true; break;
                        }
                    }
                    if( !(chk_pres) ){
                        inp= inp.slice(0,si) + '(' + inp.slice(si,ei+1) + ')' + inp.slice(ei+1);
                        i= i+2;
                        last_op_i= last_op_i+2;
                    }
                }
                i++;
            }
            let si= last_op_i + 1;
            let j= si+1;
            let tunion1= new Set([...ops, ')']); 
            while( j<inp.length && !(tunion1.has(inp[j])) ) 
                j++;
            let ei= j-1;

            let chk_pres= false;
            for(let item of blst){
                if( arrayEquals(item,[si-1,ei+1]) ){
                    chk_pres= true; break;
                }
            }
            if( !(chk_pres) )
                inp= inp.slice(0,si) + '(' + inp.slice(si,ei+1) + ')' + inp.slice(ei+1);
        }
        return(inp);
    }
    inp=n7(inp);
    console.log("Step7: converted inp=",inp);

    console.log("\nNormalised search string=","\""+ reverse_map_exact_match_words(inp)[0]+"\"","\n");
    return(inp);
}

//"| ((abc)(d)) "
//normalise_inp("| ((abc)(d)) ")
function reverse_map_exact_match_words(inp){   // reverse map done for 1 single exact word 
    let m, patt= EXACT_MATCH_KEY + "_" + "(\\d+)" + "_";
    let first_m=null;
    while(m=inp.match(patt),m){  // in case single exact word formed due to repeated joining of multiple exacts
        if(!first_m)    first_m=m;
        else if(m[1]=="0" || m[1][0]!=="0") first_m=m; //if any sub- exact word is due to " ", return 0 to use "phrase"
        //console.log("bt=",base_txt);
        inp= inp.replace( m[0] , EXACT_MATCH_WORDS[ parseInt(m[1]) ] );
        //console.log("bt=",base_txt);
    }
    if(!first_m)
        return([inp,0]); //non-exact word
    else if(first_m[1][0]=="0" && first_m[1]!=="0")
        return([inp,1]); //exact word due to merging gp of words
    else
        return([inp,0]); //exact word due to " " specified in search string
}

class elem{
    constructor(inp_str){ 
        let ops= new Set(['&','|','~']);
        this.text= inp_str;

        let a= new Set(inp_str);
        let intersect = new Set([...a].filter(i => ops.has(i)));
        if( intersect.size > 0 )
            this.stype= 1;
        else
            this.stype=0;
        this.kids=[];
        this.ops=[];
    }
    /*get_all_leaf_texts(){
        let leaf_texts= [];
        if(this.kids.length==0)
            leaf_texts.push(this.text);
        else
            for(let kid of this.kids){
                let klt= kid.get_all_leaf_texts();
                console.log("klt",klt);
                leaf_texts= [...leaf_texts, ...klt];
            }
        leaf_texts= new Set(leaf_texts);
        return(leaf_texts);
    }*/
    form_query(){
        if(this.stype==0){
            let base_txt= this.text;
            let text_query= {"bool":{"should":[],"minimum_should_match":1}};
            if(base_txt.search(EXACT_MATCH_KEY)==-1){
                // non-exact word 
                let js= {"multi_match":{"query":base_txt,"fields":Array.from(SEARCH_FIELDS),"max_expansions":"200","fuzziness":"AUTO","prefix_length":3}};
                text_query["bool"]["should"].push(js);
                //for(let search_field of SEARCH_FIELDS){
                //    let js= {"prefix":{[search_field]:base_txt}};   //[key]::computes key/[...] 
                //    text_query["bool"]["should"].push(js);
                //}
            }
            else{
                let bt= reverse_map_exact_match_words(base_txt);
                base_txt= bt[0];
                if(bt[1]==0){ 
                    //exact word due to " " specified in search string
                    let js= {"multi_match":{"type":"phrase","query":base_txt,"fields":Array.from(SEARCH_FIELDS),"max_expansions":"200"}};
                    text_query["bool"]["should"].push(js);
                }
                else{
                    //exact word due to merging non-exact gp of words
                    let js= {"multi_match":{"query":base_txt,"fields":Array.from(SEARCH_FIELDS),"max_expansions":"200","fuzziness":"AUTO","prefix_length":3}};
                    text_query["bool"]["should"].push(js);
                }
            }
            let quer= text_query;
            return(quer);
        }

        let tops= this.ops;
        let tkids= Array.from(this.kids);

        let tops_str= tops.join("");
        let and_pos= tops_str.search("&");
        let or_pos= tops_str.search("\\|");
        let minus_pos= tops_str.search("~");

        let tquer= {"bool":{"must":[],"should":[],"must_not":[]}}; //,"minimum_should_match":1}}

        let i;
        if(tops.includes("&")){      //overall "and" query or "and->minus" query
            i= and_pos;
            tquer["bool"]["must"].push(tkids[i].form_query());
            
            while(i<tops.length){
                let kquer= tkids[i+1].form_query();
                if(tops[i]=='&')
                    tquer["bool"]["must"].push(kquer);
                else if(tops[i]=='~')
                    tquer["bool"]["must_not"].push(kquer);
                i++;
            }
        }

        else if(tops.includes("|")){    //overall "and" query or "and->minus" query
            i= or_pos;
            tquer["bool"]["should"].push(tkids[i].form_query());
            
            while(i<tops.length){
                let kquer= tkids[i+1].form_query();
                if(tops[i]=='|')
                    tquer["bool"]["should"].push(kquer);
                else if(tops[i]=='~')
                    tquer["bool"]["must_not"].push(kquer);
                i++;
            }
        }
        else if(tops.includes("~")){    //overall "minus" query
            i= minus_pos;
            tquer["bool"]["must"].push(tkids[i].form_query());
            
            while(i<tops.length){
                let kquer= tkids[i+1].form_query();
                tquer["bool"]["must_not"].push(kquer);
                i++;
            }
        }
        return(tquer);
    }
}

function create_elem_tree(lst, inp){
    let pars= [], ops=[];
    if(lst.length==0)
        return [pars,ops];
    if(lst.length==1){
        let nsi=lst[0][0], nei=lst[0][1];
        let nelem= new elem(inp.slice(nsi+1,nei));
        pars.push(nelem);
        return [pars,ops];
    }
    let i=0;
    while( i<lst.length ){
        let nsi=lst[i][0], nei=lst[i][1];
        let nelem= new elem(inp.slice(nsi+1,nei));
        let j= i+1;
        while( j<lst.length && lst[j][0]<nei )
            j++;
        let out= create_elem_tree(lst.slice(i+1,j),inp);
        nelem.kids= out[0]; nelem.ops= out[1];
        pars.push(nelem);
        if( j<lst.length )
            ops.push(inp[lst[j][0]-1]);
        i=j;
    }
    return([pars,ops]);
}

function validate_tree(root){
    let all_ops=  new Set(['&','|','~']);
    let ekids=root.kids, eops=root.ops;

    let lk= ekids.length, lo=eops.length;
    if( (lk==0 && lo!==0) || (lk>0 && lk-1!==lo) ){
        console.log("valid false 1",root.text,lk,lo);
        return(false);
    }
    for( let op of eops )
        if( !(all_ops.has(op)) ){
            console.log("valid false 2",root.text);
            return(false);
        }
    if( lk==0 ){
        let text= root.text;
        
        if(text.length==0)  return(false);

        let a= new Set(text);
        let intersect = new Set([...a].filter(i => all_ops.has(i)));
        if( intersect.size > 0 ){
            console.log("valid false 3",root.text);
            return(false);
        }
        //patt= r'\w+';
        //if not re.fullmatch(patt,text):
        //    return(false);
    }
    else
        for(let kid of ekids)
            if( !(validate_tree(kid)) ){
                return(false);
            }
    return(true);
}

//PATTERN MATCHING:: OR '|' symbol ::
//Use "\\|" when explicitly specifying a pattern
//Use "\|" when creating a string variable, & using that variable as pattern

function normalise_tree(root){
    //overall str to (and/or)*->minus* format
    
    let ekids= root.kids, eops=root.ops;

    //normalise-kids
    let nekids= []; 
    for( let kid of ekids ){
        let nkid= normalise_tree(kid);
        nekids.push(nkid);
    }
    ekids= nekids; root.kids= nekids;
    
    let is_valid= false; 
    while( !(is_valid) ){
        //check valid-patt
        let eops_str= eops.join(""); 
        //console.log("eops_str:",eops_str);
        let valid_patts= ["&+~*", "\\|+~*", "~*"];
        for( let patt of valid_patts){
            p= eops_str.match(patt);
            if( (p) && (p[0]==eops_str) ){
                is_valid=true; break;
            }
        }
        if(is_valid)
            return(root);

        valid_patts= ["&+", "\\|+"]; //["&+~*", "\\|+~*"];
        let merge_possib= false;
        //merge/combine (and) -> (or) 
        let ps=[];
        for(let patt of valid_patts)
            ps.push(eops_str.match(patt));
        let p1;
        for(let p of ps){
            if(p){
                p1= p; merge_possib=true; break;
            }
        }
        if(!(merge_possib)){
            console.log("Cant convert to a valid pattern:",root.text);
            return false;
        }
        let op_p= p1[0]; let orig_op_p= op_p;
        let n_op_p= [];
        for(let ch of op_p){
            if(ch=="|") n_op_p.push("\\","|");
            else n_op_p.push(ch);
        }
        op_p= n_op_p.join("");
        //console.log("op patt to merge:",op_p);
        let si= eops_str.search(op_p);
        let ei= si + orig_op_p.length - 1;
        //console.log("si:ei to merge",si,ei);

        let merge_elems= ekids.slice(si,ei+2); 
        let merge_ops= eops.slice(si,ei+1);

        let sup_text= merge_elems[0].text;
        for(let i=0;i<merge_ops.length;i++)
            sup_text= sup_text + (merge_ops[i]+(merge_elems[i+1].text));
        let sup_elem= new elem(sup_text);
        sup_elem.kids= merge_elems;
        sup_elem.ops= merge_ops;

        ekids.splice(ei+1,1); //ekids.pop(ei+1);

        for(let i=ei;i>si-1;i--){
            ekids.splice(i,1); eops.splice(i,1); //ekids.pop(i); eops.pop(i);
        }

        ekids.splice(si, 0, sup_elem);
        // console.log("After merging::");
        // for(let kid of root.kids)
        //    console.log("root-kid::",kid.text);
        // for(let kid of root.ops)
        //    console.log("root-op::",kid);
    }
}


function get_es_query(inp,use_backup_quer){
    
    if(use_backup_quer){
        let ninp= [], all_ops=  new Set(['&','|','~','(',')','"']);
        for(let ch of inp){
            if(!all_ops.has(ch))    ninp.push(ch);
            else ninp.push(" ");
        }
        inp= ninp.join("");
        let quer= {"multi_match":{"query":inp,"fields": Array.from(SEARCH_FIELDS) }};
        return(quer);
    }

    console.log("Parsing exact match words...")
    inp= parse_exact_match_words(inp);
    if(inp==-1) {
        console.log("Fail: parse exact match words"); return(false);
    }

    console.log("Parsing brackets...");
    let x= parse_brackets(inp);
    if(!x){
        console.log("Fail: parse brackets-1"); return(false);
    }
    console.log("Normalising i/p...")
    inp= normalise_inp(inp)

    if(inp=="()"){
        let quer= {"match_all": {}};
        return(quer);
    }
    
    let elems= parse_brackets(inp)
    if(!elems){
        console.log("Fail: parse brackets-2"); return(false);
    }
    elems.sort(function(a, b){
        if(a[0] > b[0])    return 1;
        else if(a[0] < b[0]) return -1;
        else{
            if(a[1] > b[1])    return -1;
            else if(a[1] < b[1]) return 1;
            else return 0;
        }
    });
    //elems.sort(key=lambda x:(x[0],(-1)*x[1]))
    
    console.log("Creating elem tree...");
    let pout= create_elem_tree(elems,inp);
    let pelems= pout[0], pops= pout[1];
    let root_elem;
    if( elems.length==1 && arrayEquals(elems[0],[0,inp.length-1]) ){
        root_elem= new elem(inp.slice(1,inp.length-1));
        root_elem.kids= []; root_elem.ops= [];
    }
    else{
        root_elem= new elem(inp);
        root_elem.kids= pelems; root_elem.ops= pops;
    }
    

    //console.log("Getting all Leaf-texts...");
    //let all_leaf_texts= root_elem.get_all_leaf_texts();
    //console.log(all_leaf_texts);
    
    console.log("Validating elem tree...");
    let vt= validate_tree(root_elem);
    if(!vt){
        console.log("Fail: validate tree"); return(false);
    }

    console.log("Normalising elem tree...");
    root_elem= normalise_tree(root_elem)
    if(!root_elem){
        console.log("Fail: normalise tree"); return(false);
    }

    //console.log(root_elem.text);
    //console.log(root_elem.ops);
    //for(let kid of root_elem.kids)
    //    console.log(kid.text);

    console.log("Forming ES query...");
    let quer= root_elem.form_query();
    
    return(quer);
}

function get_fts_quer(search_string,hits_size=10){
    let inp= search_string; let quer;
    try{
        quer= get_es_query(inp); 
    }
    catch(err){
        console.log("Got error:-\n",err.message);
    }
    if(!quer){
        console.log("Unable to form es_query.. Using backup query!");
        quer= get_es_query(inp,use_backup_quer=true); 
    }
    let es_quer= {"query":quer,"_source":SEARCH_FIELDS,"size": hits_size};
    return(es_quer);
}


function get_fts_quer2(){
    let ss= document.getElementById("fts_inp").value;
    let out= get_fts_quer(ss);
    let out1= JSON.stringify(out);
    let out2= JSON.stringify(out, null, "    ");
    document.getElementById("es_quer1").innerHTML= out1;
    document.getElementById("es_quer2").innerHTML= out2;
    navigator.clipboard.writeText(out1);
    document.getElementById("copy2clip_status").innerHTML= "<br> Es query copied to clipboard! <br><br><br>";
}

let SEARCH_FIELDS= ["description","dataset_id","abstract","tissue","kw_drug","kw_cell_line","summary","disease","organism","kw_gene"];         
//let SEARCH_FIELDS_EXACT= ["dataset_id","tissue","kw_drug","kw_cell_line","disease","organism","kw_gene"];
let EXACT_MATCH_KEY="emw"; //keep lowercase
let EXACT_MATCH_WORDS=[];

let search_strings= [
                //ops searches  :c=8
                "liver &cancer", 
                "(liver& (a|b\" )",
                "(liv1~liv2)&liv3|liv4",
                "liv1 &can ~ liv2 |liv3 ", 
                 "liver & (cancer | gene)", 
                "(liver~cancer) |(liver~gen) ",
                 "liver&&cancer",  //fail
                 "(liver &cancer) ~ (gen| cell) ",

                //null searches :c=5
                ""," ","( )","& ~","&~  (())",    

                //single item searches :c=6
                "liv","(liv)","liv can","(liv can)"," liv ~ (can)","(liv ~ liv can)",

                //exact-match searches
                "\"ab\" \"cd\"",
                "ab \"cd\"",
                "\"ab\" cd",
                "liver & \"heart dis\"",
                "liver & heart dis",
                "\"ab & cd\" ~ ef gh",
                "liver cancer & \"heart dis\"",
                "liver cancer & heart dis",
                "\"liver cancer\" & \"heart dis\"",
                "B6 g7 mice & NOD~ RAG1-/-",
                "(tumor analysis)| (genom & cell)",
                "ab  cd \"ef gh\" & \"ij\" (gen |canc)",
                "(  a ) b",
                "\"liv canc\" & \"carc\" | blast"]


let outs=[];
for(let ss of search_strings.slice(19,23)){
    EXACT_MATCH_WORDS=[];
    console.log("\t\t","Search string=",ss);
    let out= get_fts_quer(ss);

    let out_json= JSON.stringify(out);
    outs.push(ss); outs.push(out_json); 

    let out_json2= JSON.stringify(out, null, "  ")
    console.log(out_json2,"\n\n\n");
}

// DONT OVERWRITE FILE
// var fs = require('fs');
// fs.writeFile('fts_tests_apr13.out', outs.join("\n"), function(err) {
//     if (err) throw err;
//     console.log('Write to file.. Complete.');
//     }
// );

//multi-match empty ES, check es o/p
//Es parse fail or 0 hits --> then no hits shown on ui? confirm
//record failure search-strings (in prod)