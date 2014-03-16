center=0   # Start position of the center of the first image.
# This can be ANYTHING, as only relative changes are important.


outputFile=$1
shift

for image in $@
do

    # Add 70 to the previous images relative offset to add to each image
    #
    center=`convert xc: -format "%[fx: $center +170 ]" info:`

    # read image, add fluff, and using centered padding/trim locate the
    # center of the image at the next location (relative to the last).
    #
    convert -size 500x500 "$image" -thumbnail 480x480 \
        -set -bordercolor Lavender -background black \
        -pointsize 12  -density 96x96  +polaroid  -resize 30% \
        -gravity center -background None -extent 200x200 -trim \
        -repage +${center}+0\!    MIFF:-

done |
# read pipeline of positioned images, and merge together
convert -background white   MIFF:-  -layers merge +repage \
    -bordercolor white -border 3x3   $outputFile

