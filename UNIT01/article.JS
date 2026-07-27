document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "educational_unit_2.2_progress";

    const btnStartQuiz = document.getElementById("btn-start-quiz");


    const articlesSequence = [

        "UNIT01/article011.HTML",
        "UNIT01/article012.HTML",
        "UNIT01/article013.HTML",
        "UNIT01/article014.HTML",
        "UNIT01/article015.HTML",
        "UNIT01/article016.HTML",
        "UNIT01/article017.HTML",
        "UNIT01/article018.HTML",
        "UNIT01/article019.HTML",
        "UNIT01/article011 - Copy (9).HTML"

    ];


    /*
    =====================================
    تحديد المقال الحالي
    =====================================
    */

    const currentFile =
        window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


    const currentArticle =
        articlesSequence.find(article =>
            article.toLowerCase().endsWith(currentFile)
        );


    if (!currentArticle) {

        console.error(
            "لم يتم العثور على المقال:",
            currentFile
        );

        return;

    }


    const currentIndex =
        articlesSequence.indexOf(currentArticle);



    const nextArticle =
        articlesSequence[currentIndex + 1]
        || currentArticle;



    /*
    =====================================
    تحميل التخزين
    =====================================
    */


    function loadProgress(){

        try{

            const saved =
                localStorage.getItem(STORAGE_KEY);


            if(saved){

                return JSON.parse(saved);

            }


        }catch(error){

            console.error(
                "خطأ قراءة التخزين",
                error
            );

        }



        return {

            currentActiveFile:
                articlesSequence[0],

            completedArticles: [],

            scrollPositions: {},

            bookmarks: []

        };

    }




    let progress = loadProgress();



    if(!Array.isArray(progress.completedArticles))
        progress.completedArticles=[];


    if(!progress.scrollPositions)
        progress.scrollPositions={};


    if(!progress.bookmarks)
        progress.bookmarks=[];



    /*
    =====================================
    حفظ التخزين
    =====================================
    */


    function saveProgress(){

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(progress)

        );


        console.log(
            "تم الحفظ:",
            progress
        );

    }



    // إنشاء التخزين أول مرة

    saveProgress();





    /*
    =====================================
    استرجاع مكان القراءة
    =====================================
    */


    const savedPosition =
        progress.scrollPositions[currentArticle];


    if(savedPosition){

        setTimeout(()=>{

            window.scrollTo({

                top:savedPosition,

                behavior:"instant"

            });


        },300);

    }





    /*
    =====================================
    حفظ مكان القراءة
    =====================================
    */


    let scrollTimer;


    window.addEventListener(
        "scroll",
        ()=>{


            clearTimeout(scrollTimer);


            scrollTimer=setTimeout(()=>{


                progress.scrollPositions[currentArticle]
                    =
                    window.scrollY;


                saveProgress();



            },500);



        }

    );





    /*
    =====================================
    إنهاء المقال
    =====================================
    */


    function finishArticle(){



        if(
            !progress.completedArticles.includes(
                currentArticle
            )
        ){

            progress.completedArticles.push(
                currentArticle
            );

        }



        progress.currentActiveFile =
            nextArticle;



        delete progress.scrollPositions[currentArticle];



        saveProgress();



    }






    /*
    =====================================
    زر الاختبار
    =====================================
    */


    if(btnStartQuiz){


        btnStartQuiz.addEventListener(
            "click",
            function(e){


                e.preventDefault();


                finishArticle();



                const link =
                    this.getAttribute("href");



                setTimeout(()=>{


                    window.location.href =
                        link;



                },100);



            }

        );

    }





    /*
    =====================================
    حفظ العلامة Bookmark
    =====================================
    */


    const bookmarkBtn =
        document.getElementById("btn-bookmark");


    if(bookmarkBtn){


        bookmarkBtn.addEventListener(
            "click",
            ()=>{


                if(
                    !progress.bookmarks.includes(
                        currentArticle
                    )
                ){

                    progress.bookmarks.push(
                        currentArticle
                    );


                }else{


                    progress.bookmarks =
                        progress.bookmarks.filter(
                            x=>x!==currentArticle
                        );


                }


                saveProgress();


            }

        );


    }





    /*
    =====================================
    مشاركة الرابط
    =====================================
    */


    const shareBtn =
        document.getElementById("btn-share");


    if(shareBtn){


        shareBtn.addEventListener(
            "click",
            async ()=>{


                try{


                    await navigator.clipboard.writeText(
                        window.location.href
                    );


                    alert(
                        "تم نسخ رابط المقال"
                    );


                }catch{


                    console.log(
                        "تعذر النسخ"
                    );


                }


            }

        );


    }





    /*
    =====================================
    إعادة تحميل الحالة عند الرجوع
    =====================================
    */


    window.addEventListener(
        "pageshow",
        ()=>{

            progress =
                loadProgress();

        }

    );



});