/**
 * Creates method and classes which worlk with genetic algorithms and neuroevolution
 *
 * @param {options} An object, which gives us different options with neuroevolution algo
 */
var Neuroevolution = function (options) {
	var self = this; // Just a pointer

	// Define module parameteres and add default value
	self.options = {
		/**
		 * Logistic activation function
		 *
		 * @param {a} Input The value
		 * @return Logistic function output
		 */
		activation: function (a) {
			ap = (-a) / 1;
			return (1 / (1 + Math.exp(ap)))
		},

		/**
		 * Returns random value from -1 to 1
		 *
		 * @return random value output
		 */
		randomClamped: function () {
			return Math.random() * 2 - 1;
		},

		// Different type of parameters for learning purposes
		network: [1, [1], 1], // Perceptron structure with 1 hidden layer currently
		population: 50, // Population in each generation of neurons
		elitism: 0.2, // Intensity (percentage of the "best" neurons to remain in the next generation)
		randomBehaviour: 0.2, // New random members of generation
		mutationRate: 0.1, // Mutaton intensity on synapse weights
		mutationRange: 0.5, // mutation interval is changing and we need variable for the change range
		historic: 0, // variable to save the last generation
		lowHistoric: false, // the safe score (not network).
		scoreSort: -1, // sort decreasing order (+1 would be acsending)
		nbChild: 1 // Children amount in the next generation

	}

	/**
	 * override default values
	 *
	 * @param {options} An object for neuroevolution options
	 * @return output (void)
	 */
	self.set = function (options) {
		for (var i in options) {
			if (this.options[i] != undefined) { // override just in case we have defined parameter while calling the function
				self.options[i] = options[i];
			}
		}
	}

	// override the default values
	self.set(options);


	/*Neuron**********************************************************************/
	/**
	 * Artificial neuron class
	 *
	 * @constructor
	 */
	var Neuron = function () {
		this.value = 0;
		this.weights = [];
	}

	/**
	 * Initialize the first generation of the neurons and assign random values
	 *
	 * @param {nb} Number input info size.
	 * @return output (void)
	 */
	Neuron.prototype.populate = function (nb) {
		this.weights = [];
		for (var i = 0; i < nb; i++) {
			this.weights.push(self.options.randomClamped());
		}
	}


	/*Layer***********************************************************************/
	/**
	 * Neuron Layer class
	 *
	 * @constructor
	 * @param {index} Index index of the layer in the network
	 */
	var Layer = function (index) {
		this.id = index || 0;
		this.neurons = [];
	}

	/**
	 * Populate the neuron layer
	 *
	 * 
	 *
	 * @param {nbNeurons} Number the quantity of neurons
	 * @param {nbInputs} Number the amount of input
	 * @return output (void)
	 */
	Layer.prototype.populate = function (nbNeurons, nbInputs) {
		this.neurons = [];
		for (var i = 0; i < nbNeurons; i++) {
			var n = new Neuron();
			n.populate(nbInputs);
			this.neurons.push(n);
		}
	}


	/*Neural Network**************************************************************/
	/**
	 * Neural Network class
	 *
	 * 
	 *
	 * @constructor
	 */
	var Network = function () {
		this.layers = [];
	}

	/**
	 * Network's layer generation
	 *
	 * @param {input} Number number of neurons on the input layer
	 * @param {hidden} Number neuron number on each hidden layer
	 * @param {output} Number neuron number on the output layer
	 * @return output (void)
	 */
	Network.prototype.perceptronGeneration = function (input, hiddens, output) {
		var index = 0;
		var previousNeurons = 0;
		var layer = new Layer(index);
		layer.populate(input, previousNeurons); //This is not the input layer so the number of neurons will be 0
		previousNeurons = input; // The number of input neurons should be equal to previous layer's dimensions
		this.layers.push(layer);
		index++;
		for (var i in hiddens) {
			// repeat the same process for every layer like for the first one
			var layer = new Layer(index);
			layer.populate(hiddens[i], previousNeurons);
			previousNeurons = hiddens[i];
			this.layers.push(layer);
			index++;
		}
		var layer = new Layer(index);
		layer.populate(output, previousNeurons);
		this.layers.push(layer);
	}

	/**
	 * Create the copy of the neural network(weights and layers).
	 *
	 * returns the quantity of neurons and the array of weights
	 *
	 * @return output 
	 */
	Network.prototype.getSave = function () {
		var datas = {
			neurons: [], // neuron number on every layer
			weights: [] // weights for every neuron's input
		};

		for (var i in this.layers) {
			datas.neurons.push(this.layers[i].neurons.length);
			for (var j in this.layers[i].neurons) {
				for (var k in this.layers[i].neurons[j].weights) {
					//populate the array with such weights
					datas.weights.push(this.layers[i].neurons[j].weights[k]);
				}
			}
		}
		return datas;
	}

	/**
	 * Network properties modifications.
	 *
	 * @param {save} Copy save the network copy.
	 * @return 
	 */
	Network.prototype.setSave = function (save) {
		var previousNeurons = 0;
		var index = 0;
		var indexWeights = 0;
		this.layers = [];
		for (var i in save.neurons) {
			// create the layer and populate it
			var layer = new Layer(index);
			layer.populate(save.neurons[i], previousNeurons);
			for (var j in layer.neurons) {
				for (var k in layer.neurons[j].weights) {
					// assign the weights of neurons to the input
					layer.neurons[j].weights[k] = save.weights[indexWeights];

					indexWeights++; // increase array index
				}
			}
			previousNeurons = save.neurons[i];
			index++;
			this.layers.push(layer);
		}
	}

	/**
	 * Calculate the output with the input given
	 *
	 * @param {inputs} Set input data set
	 * @return network output
	 */
	Network.prototype.compute = function (inputs) {
		// each neuron dataset in the input layer
		for (var i in inputs) {
			if (this.layers[0] && this.layers[0].neurons[i]) {
				this.layers[0].neurons[i].value = inputs[i];
			}
		}

		var prevLayer = this.layers[0]; // previous layer is the input layer
		for (var i = 1; i < this.layers.length; i++) {
			for (var j in this.layers[i].neurons) {
				// for every neuron in every network
				var sum = 0;
				for (var k in prevLayer.neurons) {
					// In every neuron there's the input form the previous layer
					sum += prevLayer.neurons[k].value *
						this.layers[i].neurons[j].weights[k];
				}

				// Calculate the activation for eahc neuron
				this.layers[i].neurons[j].value = self.options.activation(sum);
			}
			prevLayer = this.layers[i];
		}

		// Network's all possible outputs 
		var out = [];
		var lastLayer = this.layers[this.layers.length - 1];
		for (var i in lastLayer.neurons) {
			out.push(lastLayer.neurons[i].value);
		}
		return out;
	}


	/*Genome**********************************************************************/
	/**
	 * Genome class
	 *
	 *
	 *
	 * @constructor
	 *
	 * @param {score}
	 * @param {network}
	 */
	var Genome = function (score, network) {
		this.score = score || 0;
		this.network = network || null;
	}


	/*Generation******************************************************************/
	/**
	 * Generation class
	 *
	 * Is constructed by the set of genomes
	 *
	 * @constructor
	 */
	var Generation = function () {
		this.genomes = [];
	}

	/**
	 * add the genome to the generation
	 *
	 * @param {genome} Genome add genome
	 * @return out void.
	 */
	Generation.prototype.addGenome = function (genome) {
		// Add the genome in the correct place
		for (var i = 0; i < this.genomes.length; i++) {
			// Sort descending
			if (self.options.scoreSort < 0) {
				if (genome.score > this.genomes[i].score) {
					break;
				}
				// sort ascending
			} else {
				if (genome.score < this.genomes[i].score) {
					break;
				}
			}

		}

		this.genomes.splice(i, 0, genome);
	}

	/**
	 * Generate genomes for the ne generation
	 *
	 * @param {g1} Genome 1.
	 * @param {g2} Genome 2.
	 * @param {nbChilds} Number the amount of children.
	 */
	Generation.prototype.breed = function (g1, g2, nbChilds) {
		var datas = [];
		for (var nb = 0; nb < nbChilds; nb++) {
			// Clone of genome 1
			var data = JSON.parse(JSON.stringify(g1));
			for (var i in g2.network.weights) {
				// Genetic Cross
				// 0.5 is a cross factor
				if (Math.random() <= 0.5) {
					data.network.weights[i] = g2.network.weights[i];
				}
			}

			// Mutate several weights
			for (var i in data.network.weights) {
				if (Math.random() <= self.options.mutationRate) {
					data.network.weights[i] += Math.random() *
						self.options.mutationRange *
						2 -
						self.options.mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	}

	/**
	 * Generate the next generation
	 *
	 * @return array of next gen neuros.
	 */
	Generation.prototype.generateNextGeneration = function () {
		var nexts = [];

		for (var i = 0; i < Math.round(self.options.elitism *
			self.options.population); i++) {
			if (nexts.length < self.options.population) {
				// Genome deep copy addition
				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
			}
		}

		for (var i = 0; i < Math.round(self.options.randomBehaviour *
			self.options.population); i++) {
			var n = JSON.parse(JSON.stringify(this.genomes[0].network));
			for (var k in n.weights) {
				n.weights[k] = self.options.randomClamped();
			}
			if (nexts.length < self.options.population) {
				nexts.push(n);
			}
		}

		var max = 0;
		while (true) {
			for (var i = 0; i < max; i++) {
				// create children and add them to the array
				var childs = this.breed(this.genomes[i], this.genomes[max],
					(self.options.nbChild > 0 ? self.options.nbChild : 1));
				for (var c in childs) {
					nexts.push(childs[c].network);
					if (nexts.length >= self.options.population) {
						// Return by the time when the amount of the children will be equal to the population size
						return nexts;
					}
				}
			}
			max++;
			if (max >= this.genomes.length - 1) {
				max = 0;
			}
		}
	}


	/*Generations*****************************************************************/
	/**
	 * Genrations class
	 *
	 * Saves previous and current generations
	 *
	 * @constructor
	 */
	var Generations = function () {
		this.generations = [];
		var currentGeneration = new Generation();
	}

	/**
	 * Generate the first gen
	 *
	 * @param {input} Input input layer
	 * @param {input} Hidden hidden layer
	 * @param {output} Output output layer
	 * @return
	 */
	Generations.prototype.firstGeneration = function (input, hiddens, output) {

		var out = [];
		for (var i = 0; i < self.options.population; i++) {
			// generate network and save it
			var nn = new Network();
			nn.perceptronGeneration(self.options.network[0],
				self.options.network[1],
				self.options.network[2]);
			out.push(nn.getSave());
		}

		this.generations.push(new Generation());
		return out;
	}

	/**
	 * Create the next generation
	 *
	 * @return 
	 */
	Generations.prototype.nextGeneration = function () {
		if (this.generations.length == 0) {
			// Need to create first generation.
			return false;
		}

		var gen = this.generations[this.generations.length - 1]
			.generateNextGeneration();
		this.generations.push(new Generation());
		return gen;
	}

	/**
	 * Add genoem to the generation
	 *
	 * @param {genome}
	 * @return this is false if the generation doesn't exist at all
	 */
	Generations.prototype.addGenome = function (genome) {
		// cannot add to the generation in case its non-existance
		if (this.generations.length == 0) return false;

		// addGenome returns void, adds genome.
		return this.generations[this.generations.length - 1].addGenome(genome);
	}


	/*Current generation************************************************************************/
	self.generations = new Generations();

	/**
	 * Reset and generate new generation
	 *
	 * @return 
	 */
	self.restart = function () {
		self.generations = new Generations();
	}

	/**
	 * Create the next generation
	 *
	 * @return Neural network array for the next gen
	 */
	self.nextGeneration = function () {
		var networks = [];

		if (self.generations.generations.length == 0) {
			// if there are no generations then create the first generation
			networks = self.generations.firstGeneration();
		} else {
			// else create next generation
			networks = self.generations.nextGeneration();
		}

		// create network for the current gens
		var nns = [];
		for (var i in networks) {
			var nn = new Network();
			nn.setSave(networks[i]);
			nns.push(nn);
		}

		if (self.options.lowHistoric) {
			//delete the old network
			if (self.generations.generations.length >= 2) {
				var genomes =
					self.generations
						.generations[self.generations.generations.length - 2]
						.genomes;
				for (var i in genomes) {
					delete genomes[i].network;
				}
			}
		}

		if (self.options.historic != -1) {
			// delete the old generation
			if (self.generations.generations.length > self.options.historic + 1) {
				self.generations.generations.splice(0,
					self.generations.generations.length - (self.options.historic + 1));
			}
		}

		return nns;
	}

	/**
	 * add new generation with the specific score and type
	 *
	 * @param {network} Neural net
	 * @param {score} Score value
	 * @return 
	 */
	self.networkScore = function (network, score) {
		self.generations.addGenome(new Genome(score, network.getSave()));
	}
}
