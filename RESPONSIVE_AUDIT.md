
## Second render comparison

The fixed desktop shell and authentication split render correctly at 1440 x 900. The mobile capture at 390 x 844 still shows the brand column content clipped on the left edge: the headline and supporting copy begin outside the viewport even though the form is contained. This indicates an inherited positioning/transform or oversized inner content rule on the brand panel rather than a simple page-width problem. The next fix must explicitly reset the mobile brand copy position and constrain its width, not only reduce font size.
