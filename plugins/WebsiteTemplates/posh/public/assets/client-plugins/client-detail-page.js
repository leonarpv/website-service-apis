let pid = getParameterByName('pid');
let cid = getParameterByName('cid');
localStorage.setItem("guestPersonalInfo","")
localStorage.removeItem("requestQuoteAddress");

if(pid != null) {
    var get_product_details = function () {
        let tmp = null;
        $.ajax({
            type: 'GET',
            url: project_settings.product_api_url+"?_id="+pid,
            async: false,
            dataType: 'json',
             headers: {
                  'vid' : website_settings.Projectvid.vid
              },
            success: function (data) {
                if(data.hits.hits.length > 0)
                {
                    productData = data;
                    tmp = productData.hits.hits[0]._source;
                }
            },
            error: function(xhr, status, error) {
                  let err = eval("(" + xhr.responseText + ")");
            },
        });
        return tmp;
      }();
  
      if(get_product_details != null && get_product_details != undefined) {
          // RECENTLY VIEWED PRODUCTS
          let recentProductsName = "recentViewedProducts_"+website_settings.projectID;
          let recentViewedProducts = [];
          if (localStorage.getItem(recentProductsName) != null) {
              recentViewedProducts = JSON.parse(localStorage.getItem(recentProductsName));
          }
          
          if(!(recentViewedProducts.includes(pid))) {
              if(recentViewedProducts.length > 6) {
                  recentViewedProducts.splice(0, 1);
              }
              recentViewedProducts.push(pid);
          }
          localStorage.setItem(recentProductsName, JSON.stringify(recentViewedProducts));
  
        //   recentlyViewedProducts(recentViewedProducts);
      }
  }
// console.log('get_product_details',get_product_details)

$(document).ready( async function(){
    if(get_product_details == null ){
        hidePageAjaxLoading()
        window.location = "error404.html";
        return false;
    }
    $("#flowz_content").closest('.row').css('display','flex');
    recommededProducts();
    var productDetails = get_product_details;
    ProductName = productDetails.product_name;
    ProductImage = 'https://res.cloudinary.com/flowz/image/upload/v1531481668/websites/images/no-image.png';
    if(productDetails.images != undefined)  {
        ProductImage = productDetails.images[0].images[0].secure_url;//productDetails.default_image;
    }
    else {
    $("#download_image").parent('li').remove()
    }
    showPageAjaxLoading();

    ProductSku = productDetails.sku;
    hasImprintData = productDetails.imprint_data;

    let listHtml = $('#title .row').html();
    let titleAndSkuHtml = listHtml.replace(/#data.product_name#/g,ProductName);
    let breadcrumbHtml = $(".breadcrumb").html();
    breadcrumbHtml = breadcrumbHtml.replace(/#data.title#/g,ProductName)
    
    $(".breadcrumb").html(breadcrumbHtml);
    $('#title .row').html(titleAndSkuHtml);
    let productImageUrl = ProductImage;
    $('#product_img').attr("src",productImageUrl)
    $('#product_img').data("zoom-image",productImageUrl)
    $('#product_img').data("orig-img",productImageUrl)

    $('.js-product_sku').html(ProductSku);
    
    // product colors for sample order
    if(productDetails.attributes.colors != undefined && productDetails.attributes.colors.length > 0) {
        let sampleColorHtml = '';
        $('.sample_color_append').html('');
        let colorsHexVal = await replaceColorSwatchWithHexaCodes(productDetails.attributes.colors,"color");
        $.each(productDetails.attributes.colors, function(index_color,element_color){
            let colorVal = element_color.toLowerCase();
            colorVal = colorVal.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '_').replace(/^(-)+|(-)+$/g,'').toLowerCase();
            
            let element_color_style = "background-color:"+element_color+";"
            if(colorsHexVal != null && colorsHexVal[element_color] != undefined){
                if(typeof colorsHexVal[element_color].hexcode != 'undefined'){
                    element_color_style = "background-color:"+colorsHexVal[element_color].hexcode+";"
                }
                else if (typeof colorsHexVal[element_color].file != 'undefined') {
                    element_color_style = "background-image:url("+colorsHexVal[element_color].file.url+");"
                }
            }

            //order sample start
            sampleColorHtml += '<tr> <td> <div class="checkbox_color" style="'+element_color_style+'" title="'+element_color+'"> <input class="js_color_checkbox" type="checkbox" name="sample_color[]" id="sample_'+colorVal+'" value="'+element_color+'" data-hex-code="'+element_color+'" /> <label for="Decoration_'+colorVal+'"></label> </div></td><td> <input type="text" name="sample_quantity[]" class="input" placeholder="Enter Quantity"> </td></tr>';
            //order sample end
        });

        $('.sample_color_append').html(sampleColorHtml);
    }

    // Add Variation Images
    let imageGallaryHtml = '<ul>';
    
    if(productDetails.images != undefined){
        for (let element of productDetails.images[0].images) {
            let imageUrl = element.secure_url;
            let color = element.color;
            color = color.toLowerCase().replace(/\s/g, '-');
            imageGallaryHtml += '<li class="slide"><a href="javascript:void(0);" class="product-thumb-img-anchar  clr_'+color+'_link" data-zoom-image="'+imageUrl+'">';
            imageGallaryHtml += '<img data-orig-img-'+color+'="'+imageUrl+'" src="'+imageUrl+'" class="clr_'+color+' lazyLoad" alt="'+ProductName+'" title="'+ProductName+'" /></a><input type="hidden" id="var_img_clr_id" value="clr_'+element.color+'"/></li>';
        }
    }
    else
    {
      imageGallaryHtml += '<li class="slide"><a href="javascript:void(0);" class="product-thumb-img-anchar  clr_default_link" data-zoom-image="'+productImageUrl+'">';
      imageGallaryHtml += '<img data-orig-img-default="'+productImageUrl+'" src="'+productImageUrl+'" class="clr_default lazyLoad" alt="'+ProductName+'" title="'+ProductName+'" /></a><input type="hidden" id="var_img_clr_id" value="clr_default"/></li>';
    }
    imageGallaryHtml +='</ul>'

    $(".js-image-gallery").html(imageGallaryHtml);
    // END - Add Variation Images

    // Product Quantity Price
    if(productDetails.pricing != undefined){
        let priceRang = '';
            $.each(productDetails.pricing, function(index,element){
                if(element.price_type == "regular" && element.type == "decorative" && element.global_price_type == "global"){
                     $.each(element.price_range,function(index,element2){
                       // console.log("in each condition");
                       if(element2.qty.lte != undefined){
                          priceRang += '<div><div class="table-heading">'+ element2.qty.gte + '-' + element2.qty.lte + '</div><div class="table-content">' + '$' + parseFloat(element2.price).toFixed(project_settings.price_decimal) + '</div></div>';
                        }
                        else
                        {
                            priceRang += '<div><div class="table-heading">'+ element2.qty.gte + '+' + '</div><div class="table-content">' + '$' + parseFloat(element2.price).toFixed(project_settings.price_decimal) + '</div></div>';
                        }
                         });
                     $(".quantity-table-col").html(priceRang);
                     $(".js-responsive-qunatity").html(priceRang);
                }
            });
       }

        // QUANTITY PRICE TABLE START
        $(".quantity-table-col").owlCarousel({ 
            loop:false,
            navigation: true,
            items:5,
            autoPlay: 3200,
            margin: 10,
            autoplayHoverPause: true,
            lazyLoad: true,
            stopOnHover: true,
            itemsCustom: false,
            itemsDesktop: [1170, 5],
            itemsDesktop: [1024, 3],
            itemsTabletSmall: false,
            itemsMobile: [400, 2],
            itemsMobile: [399, 1],
            singleItem: false,
            itemsScaleUp: false,
            afterInit: function (elem) {
                var that = this
                that.owlControls.prependTo(elem)
            }
        });
        // END QUANTITY PRICE TABLE END
        //RECENTLY VIEWED PRODUCTS
            $("#owl-carousel-recently-products").owlCarousel({
                // navigation: true,
                items:6,
                autoPlay: 3200,
                margin: 10,
                autoplayHoverPause: true,
                lazyLoad: true,
                stopOnHover: true,
                itemsCustom: false,
                itemsDesktop: [1170, 6],
                itemsDesktop: [1024, 3],
                itemsTabletSmall: false,
                itemsMobile: [400, 2],
                itemsMobile: [399, 1],
                singleItem: false,
                itemsScaleUp: false,
                // afterInit: function (elem) {
                //     var that = this
                //     that.owlControls.prependTo(elem)
                // }
            });
        // Zoom Image
        $('.product-gallery').zoom({ on:'click' });
        $(".product-thumb-img-anchar").on('click', function () {
                $('.product-gallery').trigger('zoom.destroy');
                var img_src = $(this).find("img").attr("src");
                $(".product-big-image").find("img").attr("src", img_src);
                $('.product-gallery').zoom({ on:'click' });
        });

        //product description
        if(typeof productDetails.description !== "undefined" && productDetails.description != '') {
            $('.js-product_description_text').html(productDetails.description);
        }

        //Specification

        if(typeof productDetails.description !== "undefined" && productDetails.description != '') 
        {
            let fetureList = '';
            for (let [i, features] of productDetails.features.entries() ) {
                fetureList += "<li>"+features.value+"</li>";
            }
            $('.js-specification').html(fetureList);
        }
        // Shipping
        if(productDetails.shipping instanceof Array) {
            if(productDetails.shipping[0].free_on_board != undefined && productDetails.shipping[0].free_on_board != ''){
                fob = productDetails.shipping[0].free_on_board;
                $('.js-product-shipping-text').append("<strong>FOB:</strong> "+fob+"<br/>");
            }
            if(productDetails.shipping[0].carton_length != undefined && productDetails.shipping[0].carton_length != ''){
                carton_length = productDetails.shipping[0].carton_length+" "+productDetails.shipping[0].carton_size_unit;
                $('.js-product-shipping-text').append("<strong>Carton Length:</strong> "+carton_length+"<br/>");
            }
            if(productDetails.shipping[0].carton_weight != undefined  && productDetails.shipping[0].carton_weight != ''){
                carton_weight = productDetails.shipping[0].carton_weight+" "+productDetails.shipping[0].carton_weight_unit;
                $('.js-product-shipping-text').append("<strong>Carton Weight:</strong>"+carton_weight+"<br/>");
            }
            if(productDetails.shipping[0].shipping_qty_per_carton !=undefined  && productDetails.shipping[0].shipping_qty_per_carton != ''){
                shipping_qty_per_carton = productDetails.shipping[0].shipping_qty_per_carton;
                $('.js-product-shipping-text').append("<strong>Qty Per Carton:</strong>"+shipping_qty_per_carton+"<br/>");
            }
        }
        // END

        // Decoration option - Imprint
        if(productDetails.imprint_data instanceof Array) {
            let imprint_data = productDetails.imprint_data;
            let decorationSectionHtml = '';

            for(let item in imprint_data)
            {
                let decorationHtml = '';
                let imprintDetails = imprint_data[item];
                
                if(typeof imprintDetails.imprint_method !== "undefined" && imprintDetails.imprint_method != '') {
                    decorationHtml +="<strong>Method:</strong> "+imprintDetails.imprint_method+"<br>";
                }
                
                if(typeof imprintDetails.imprint_position !== "undefined" && imprintDetails.imprint_position != '') {
                    decorationHtml +="<strong>Location:</strong> "+imprintDetails.imprint_position+"<br>";
                }

                if(typeof imprintDetails.setup_charge !== "undefined" && imprintDetails.setup_charge != '') {
                    decorationHtml +="<strong>Set up charge:</strong> "+imprintDetails.setup_charge+"<br>";
                }

                if(typeof imprintDetails.max_imprint_color_allowed !== "undefined" && imprintDetails.max_imprint_color_allowed != '') {
                    decorationHtml +="<strong>Max Colors:</strong> "+imprintDetails.max_imprint_color_allowed+"<br>";
                }

                if(typeof imprintDetails.imprint_area !== "undefined" && imprintDetails.imprint_area != '') {
                    decorationHtml +="<strong>Decoration Size: </strong> "+imprintDetails.imprint_area+"<br>";
                }
                

                decorationSectionHtml += '<div class="col-lg-4 col-sm-6 col-md-3 col-xs-12"><div class="specifiction"><div class="decoMethodBox">'+decorationHtml+'</div></div></div>';
            }
            $('.js-decoration_option').html(decorationSectionHtml);
        }
        else{
            $(".product-section-box.decoration-option").parent().remove();
        }
        //END
        if(productDetails.video_url == "" && $("#js-show_play_video").length > 0)
        {
            $("#js-show_play_video").parent().remove();
        }

        //Webtools
        axios({
            method: 'GET',
            url: project_settings.webtools_api_url+'?website='+website_settings['projectID']+'&sku='+ProductSku,
        })
        .then(async response => {
            if(response.data.data.length > 0){
                let webtoolData = response.data.data[0];

                if(webtoolData.product_pdf != undefined && webtoolData.product_pdf != '') {
                    $('#download_product_template').attr('href',webtoolData.product_pdf)
                }
                else {
                    $('#download_product_template').parent('div').remove()
                }

                if(webtoolData.art_pdf != undefined && webtoolData.art_pdf != '') {
                    $('#download_art_template').attr('href',webtoolData.art_pdf)
                }
                else {
                    $('#download_art_template').parent('div').remove()
                }

                if(webtoolData.shell_sheet != undefined && webtoolData.shell_sheet != '') {
                    $('#sell_sheet').attr('href',webtoolData.shell_sheet)
                }
                else {
                    $('#sell_sheet').parent('div').remove()
                }

                if(webtoolData.gcc_pdf != undefined && webtoolData.gcc_pdf != '') {
                    $('#download_gcc_template').attr('href',webtoolData.gcc_pdf)
                }
                else {
                    $('#download_gcc_template').parent('div').remove()
                }

                if(webtoolData.special_pricing != undefined && webtoolData.special_pricing != '') {
                    $('#download_special_pricing').attr('href',webtoolData.special_pricing)
                }
                else {
                    $('#download_special_pricing').parent('div').remove()
                }
            }
            else {
                $('#download_product_template, #download_art_template, #download_gcc_template, #download_special_pricing,#sell_sheet').parent('div').remove()
            }
        })
        //End

        /* Virtual tool */
        let virtualButtonHtml = $("#ob_virtual_list").html();
        virtualButtonHtml1 = virtualButtonHtml.replace("#data.sku#",get_product_details.sku)
        // virtualButtonHtml1 = virtualButtonHtml1.replace("#data.spplierId#",get_product_details.supplier_id)
        virtualButtonHtml1 = virtualButtonHtml1.replace("#data.spplierId#",project_settings.supplier_id)
        virtualButtonHtml1 = virtualButtonHtml1.replace("#data.culture#",project_settings.default_culture)
        $("#ob_virtual_list").html(virtualButtonHtml1)
        $("#js_display_virtual").after('<script type="text/javascript" src="http://virtualmarketingcart.com/js/virtualintegration.js"></script>')

        $('.js-hide-div').removeClass("js-hide-div");
        hidePageAjaxLoading();
})

// RECENTLY VIEWED PRODUCTS

if(get_product_details != null && get_product_details != undefined) {
    // RECENTLY VIEWED PRODUCTS
    let recentProductsName = "recentViewedProducts_"+website_settings.projectID;
    let recentViewedProducts = [];
    if (localStorage.getItem(recentProductsName) != null) {
        recentViewedProducts = JSON.parse(localStorage.getItem(recentProductsName));
    }
    
    if(!(recentViewedProducts.includes(pid))) {
        if(recentViewedProducts.length > 6) {
            recentViewedProducts.splice(0, 1);
        }
        recentViewedProducts.push(pid);
    }
    localStorage.setItem(recentProductsName, JSON.stringify(recentViewedProducts));

    recentlyViewedProducts(recentProductsName,recentViewedProducts);
}

function recentlyViewedProducts(recentProductsName,recentViewedProducts) {
    if(recentViewedProducts != null && recentViewedProducts.length > 1)
    {
        let recentLoop = recentViewedProducts;
        let cIndex = recentLoop.indexOf(pid);
        if (cIndex > -1) {
            recentLoop.splice(cIndex, 1);
        }

        let recentProductHtml = "";
        $.each( recentLoop, function( key, productId ) {
            $.ajax({
                type: 'GET',
                url: project_settings.product_api_url+"?_id="+productId+"&source=default_image,product_id,sku,product_name,currency,min_price,price_1,images",
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("vid", website_settings.Projectvid.vid);
                },
                dataType: 'json',
                success: function (data) {
                    if(data.hits.hits.length > 0) {
                        if(data.hits.hits[0]._source != 'undefined' && !isEmpty(data.hits.hits[0]._source))
                        {
                            let productData = data.hits.hits[0]._source;
                            let productImage = 'https://res.cloudinary.com/flowz/image/upload/v1531481668/websites/images/no-image.png';
                            if(productData.images != undefined){
                                productImage = productData.images[0].images[0].secure_url
                            }
                            let detailLink = website_settings.BaseURL+'productdetail.html?locale='+project_settings.default_culture+'&pid='+productId;
                            // let price = parseFloat(productData.price_1).toFixed(project_settings.price_decimal);
                            let price = parseFloat(productData.min_price).toFixed(project_settings.price_decimal)

                            recentProductHtml += '<div class="item"> <div class="pro-box"> <div class="pro-image box01"> <div class="product-img-blk"> <a href="'+detailLink+'"> <img src="'+productImage+'" class="img-responsive center-block lazyLoad" alt="'+productData.product_name+'" title="'+productData.product_name+'"> </a> </div></div><div class="pro-desc"> <a href="'+detailLink+'" class="item-title"> '+productData.product_name+' </a> <div class="item-code"> Item # : '+productData.sku+' </div><div class="item-price">$ '+price+'</div><div class="list-quantity-block"></div><div class="pro-button"> <ul> <li><a href="javascript:void(0);" data-id="'+productId+'" class="js-add-to-compare"><i class="fa fa-retweet fa-fw"></i></a></li></ul> </div><div class="clearfix"></div></div><div class="clearfix"></div></div></div>';
                        }
                        else {
                            let AIndex = recentLoop.indexOf(productId);
                            if (AIndex > -1) {
                                recentLoop.splice(AIndex, 1);
                            }
                            localStorage.setItem(recentProductsName, JSON.stringify(recentLoop));
                        }
                    }
                    else {
                        recentLoop = [];
                        recentLoop.push(pid);
                        localStorage.setItem(recentProductsName, JSON.stringify(recentLoop));
                    }
                }
            });
        });

        $('#owl-carousel-recently-products').html(recentProductHtml);
        $('.js-recent-viewed-products').removeClass('hide');
    }
}

//END -  RECENTLY VIEWED PRODUCTS


// Recommended Products start

let tagProductList = function(tagObj,productBoxHtml) {
    return new Promise(async (resolve , reject ) => {
          let responseTag = await getTagListByObj(tagObj)
          let replaceProductBox = ''
          // console.log("responseTag",tagObj,responseTag);
          if(responseTag != null){
              let productResponse = await fetchProductsByTagId(responseTag[0].id)
              if(productResponse.length > 0){
                  for(let [key,value] of productResponse.entries()){
                          let productRes = await getProductDetailBySource(value.product_id,"product_id,sku,product_name,currency,min_price,price_1,images")
                          if(productRes !== undefined && productRes != null)  
                          {
                            productBoxHtml1 = productBoxHtml.replace(/#data.id#/g,value.product_id)
                            productBoxHtml1 = productBoxHtml1.replace(/#data.product_link#/g,'productdetail.html?locale='+project_settings.default_culture+'&pid='+value.product_id)
                            ProductImage = 'https://res.cloudinary.com/flowz/image/upload/v1531481668/websites/images/no-image.png';
                            
                            if(productRes.images !== undefined) {
                                ProductImage = productRes.images[0].images[0].secure_url;
                                ProductImage = addOptimizeImgUrl(ProductImage,'w_210');
                            }
                            

                            productBoxHtml1 = productBoxHtml1.replace('#data.image#',ProductImage)
                            productBoxHtml1 = productBoxHtml1.replace('#data.sku#',productRes.sku)
                            productBoxHtml1 = productBoxHtml1.replace('#data.currency#','$')
                            productBoxHtml1 = productBoxHtml1.replace('#data.price#',productRes.min_price.toFixed(project_settings.price_decimal))
                            productBoxHtml1 = productBoxHtml1.replace(/#data.title#/g,productRes.product_name)
                            productBoxHtml1 = productBoxHtml1.replace(/#data.tagSlug#/g,responseTag[0].tag_slug)
                            productBoxHtml1 = productBoxHtml1.replace(/#data.tagColor#/g,responseTag[0].tag_color)
                            productBoxHtml1 = productBoxHtml1.replace(/#data.tagName#/g,responseTag[0].tag_name)
                            replaceProductBox += productBoxHtml1
                        }
                        else{
                            replaceProductBox += '';
                            
                        }
                  }
                  resolve(replaceProductBox)
              }
          }
    })
}

async function getTagListByObj(obj) {
      let returnData = null;
    	await axios({
    			method: 'GET',
    			url: project_settings.tags_api_url+"?website="+ website_settings['projectID']+"&tag_status=true&"+obj,
    	})
    	.then(response => {
          if(response.data.data.length > 0){
              returnData = response.data.data;
          }
          return returnData
    	})
      .catch(function (error) {
      });
    	return returnData;
}

async function fetchProductsByTagId(tagId){
    let returnData = null;
    await axios({
        method: 'GET',
        url: project_settings.product_tags_api_url+"?website="+ website_settings['projectID']+"&tag_id="+tagId,
    })
    .then(response => {
        if(response.data.data.length > 0){
            returnData = response.data.data;
        }
        return returnData
    })
    .catch(function (error) {
        console.log("error",error.response);
    });
    return returnData;
}

async function recommededProducts(){
    if($(".js-tag-recommended-product-list").length > 0){
        let tagHtmlList = $(".js-tag-recommended-product-list");
        let productBoxHtml = $(".js-tag-recommended-product-list").find('.js-list').html()
        let productSlug = $(".js-tag-recommended-product-list").attr("data-slug")
        if(productSlug != ""){
            let replaceProductBox = await tagProductList("tag_slug="+productSlug,productBoxHtml)
            if(replaceProductBox != ''){
                tagHtmlList.find('.js-list').html(replaceProductBox)
                tagHtmlList.removeClass('hide')
                tagHtmlList.find("#owl-carousel-recommeded").closest(".row").css({"display": "flex"});
                
                $("#owl-carousel-recommeded-products").owlCarousel({
                    navigation: true,
                    items:6,
                    autoPlay: 3200,
                    margin: 10,
                    autoplayHoverPause: true,
                    lazyLoad: true,
                    stopOnHover: true,
                    itemsCustom: false,
                    itemsDesktop: [1170, 6],
                    itemsDesktop: [1024, 3],
                    itemsTabletSmall: false,
                    itemsMobile: [400, 2],
                    itemsMobile: [399, 1],
                    singleItem: false,
                    itemsScaleUp: false,
                    afterInit: function (elem) {
                        var that = this
                        that.owlControls.prependTo(elem)
                    }
                });
            }
        }
    }
}

// Recommended Products end