import React from "react";

export function PriceGranularity() {
    const [state, setState] = React.useState({
        firstBucketMin: 0,
        firstBucketMax: 3,
        firstBucketIncre: .001,
        secondBucketMin: 0,
        secondBucketMax: 3,
        secondBucketIncre: .001,
        thirdBucketMin: 0,
        thirdBucketMax: 3,
        thirdBucketIncre: .001
    })

    function handleChange(evt) {
        const value = evt.target.value;
        setState({
            ...state,
            [evt.target.name]: value
        });
    }

    return (
        <div>
            <h4>CUSTOM PRICING</h4>
            <form>
                <label>
                    1st Bucket
                </label>
                <input
                    type="number"
                    name="firstBucketMin"
                    value={state.firstBucketMin}
                    onChange={handleChange}
                />
                <label>
                    Minimum
                </label>
                <input
                    type="number"
                    name="firstBucketMax"
                    value={state.firstBucketMax}
                    onChange={handleChange}
                />
                <label>
                    Maximum
                </label>
                <input
                    type="number"
                    name="firstBucketIncre"
                    value={state.firstBucketIncre}
                    onChange={handleChange}
                    step="any"
                />
                <label>
                    Increments
                </label>
                <label>
                    2nd Bucket
                </label>
                <input
                    type="number"
                    name="secondBucketMin"
                    value={state.secondBucketMin}
                    onChange={handleChange}
                />
                <label>
                    Minimum
                </label>
                <input
                    type="number"
                    name="secondBucketMax"
                    value={state.secondBucketMax}
                    onChange={handleChange}
                />
                <label>
                    Maximum
                </label>
                <input
                    type="number"
                    name="secondBucketIncre"
                    value={state.secondBucketIncre}
                    onChange={handleChange}
                    step="any"
                />
                <label>
                    Increments
                </label>
                <label>
                    3rd Bucket
                </label>
                <input
                    type="number"
                    name="thirdBucketMin"
                    value={state.thirdBucketMin}
                    onChange={handleChange}
                />
                <label>
                    Minimum
                </label>
                <input
                    type="number"
                    name="thirdBucketMax"
                    value={state.thirdBucketMax}
                    onChange={handleChange}
                />
                <label>
                    Maximum
                </label>
                <input
                    type="number"
                    name="thirdBucketIncre"
                    value={state.thirdBucketIncre}
                    onChange={handleChange}
                    step="any"
                />
                <label>
                    Increments
                </label>
            </form>
        </div>
    );
}
